import { chromium, Frame } from "playwright";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { supabaseAdmin } from "./supabaseClient";

interface LinkedInArgs {
  content: string;
  imageUrl?: string | null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDecodedStorage(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) throw new Error(`Storage state file is empty: ${filePath}`);
  if (raw.startsWith("{")) return;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    if (!decoded.trim().startsWith("{")) {
      throw new Error("decoded content is not JSON");
    }
    fs.writeFileSync(filePath, decoded);
  } catch (err) {
    throw new Error(`Storage state not valid JSON or base64: ${filePath}`);
  }
}

async function dismissOverlays(page: any) {
  const selectors = [
    "button:has-text('Accept')",
    "button:has-text('Agree')",
    "button:has-text('I agree')",
    "button[data-test-global-nav-header-cookie-banner-accept]",
    "button[data-test-id='cookie-banner-consent-accept']",
  ];
  for (const sel of selectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await delay(300);
    }
  }
}

async function findEditableViaDOM(page: any): Promise<import("playwright").ElementHandle | null> {
  const handle = await page.evaluateHandle(() => {
    const matches = (el) => {
      const text = ((el.getAttribute("aria-label") || el.getAttribute("placeholder") || "") + " " + (el.textContent || "")).toLowerCase();
      if (el.getAttribute("contenteditable") === "true") return true;
      if (el.getAttribute("role") === "textbox") return true;
      if (text.includes("talk about") || text.includes("write a post") || text.includes("share your thoughts") || text.includes("what do you want")) return true;
      return false;
    };
    const visited = new Set();
    const stack = [document.documentElement];
    while (stack.length) {
      const node = stack.pop();
      if (!node || visited.has(node)) continue;
      visited.add(node);
      if (node instanceof Element && matches(node)) {
        return node;
      }
      const children = [];
      if (node.shadowRoot) children.push(node.shadowRoot);
      if (node.children) children.push(...node.children);
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
    }
    return null;
  });
  const elem = handle.asElement();
  if (!elem) {
    await handle.dispose();
    return null;
  }
  return elem;
}

async function capture(page: any, label: string) {
  try {
    const file = path.join(os.tmpdir(), `narada-li-${label}-${Date.now()}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const { data, error } = await supabaseAdmin.storage.from("post-images").upload(`debug/${path.basename(file)}`, fs.readFileSync(file), {
      contentType: "image/png",
      upsert: true
    });
    if (!error) {
      const { data: urlData } = supabaseAdmin.storage.from("post-images").getPublicUrl(data?.path || "");
      console.log(`[linkedin] Saved screenshot: ${urlData.publicUrl}`);
    } else {
      console.log(`[linkedin] Saved screenshot locally: ${file} (upload failed: ${error.message})`);
    }
  } catch (err) {
    console.log("[linkedin] Failed to save screenshot:", err);
  }
}

async function openShareModal(page: any) {
  let modal = page.locator("[data-test-modal-id='sharebox'], .share-box-home-v2").first();
  if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) return modal;

  const triggers = [
    "button:has-text('Start a post')",
    "button:has-text('Create a post')",
    "button[aria-label*='Start a post']",
    "button[aria-label*='Create a post']",
    "button.share-box-feed-entry__trigger",
    "button[data-control-name='share.feed.compose']",
    "button[data-control-name='share.start_post']",
    "button[data-test-share-box-feed-entry-trigger]",
    "button.artdeco-button--primary.share-box-feed-entry__trigger",
    "button[data-tracking-control-name*='start_post']",
    "div.feed-identity-module__actor-meta button"
  ];

  for (const sel of triggers) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click({ force: true });
      await delay(2000);
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) return modal;
    }
  }

  // Navigate to explicit create-post URL
  try {
    await page.goto("https://www.linkedin.com/feed/?createPost=true", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await delay(3000);
    modal = page.locator("[data-test-modal-id='sharebox'], .share-box-home-v2").first();
    if (await modal.isVisible({ timeout: 4000 }).catch(() => false)) return modal;
  } catch {}

  // Last-resort: JS click
  try {
    await page.evaluate(() => {
      const selectors = [
        "button.share-box-feed-entry__trigger",
        "button[data-control-name='share.feed.compose']",
        "button[aria-label*='Start a post']",
        "button[aria-label*='Create a post']",
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) { el.click(); return; }
      }
    });
    await delay(2000);
  } catch {}

  if (await modal.isVisible({ timeout: 4000 }).catch(() => false)) return modal;
  throw new Error("LinkedIn share modal not found");
}

async function downloadToTemp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = url.split("?")[0].split(".").pop() ?? "jpg";
  const tmpPath = path.join(os.tmpdir(), `narada-li-${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

export async function postToLinkedIn({ content, imageUrl }: LinkedInArgs): Promise<string | undefined> {
  ensureDecodedStorage(".sessions/linkedin.json");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    storageState: ".sessions/linkedin.json",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });

  const page = await context.newPage();
  let tmpFile: string | null = null;

  try {
    // Go straight to feed with shareActive flag to reduce homepage noise
    await page.goto("https://www.linkedin.com/feed/?shareActive=true", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(2500);
    await dismissOverlays(page);

    if (page.url().includes("/login") || page.url().includes("/authwall")) {
      throw new Error("LinkedIn session expired — re-run loginLinkedIn.ts and update LINKEDIN_SESSION secret.");
    }

    // Open share modal (may return null if none visible)
    const modal = await openShareModal(page);
    if (modal) {
      await modal.waitFor({ timeout: 30_000 });
    }
    console.log("[linkedin] Page URL:", page.url());

    // Attach image if provided
    if (imageUrl) {
      tmpFile = await downloadToTemp(imageUrl);
      console.log("  [linkedin] Attaching image:", tmpFile);

      // Click the photo/media button inside the modal
      const mediaBtn = modal.locator(
        "button[aria-label*='photo'], button[aria-label*='Photo'], button[aria-label*='media'], button[aria-label*='Media'], button[data-control-name*='photo']"
      ).first();

      if (await mediaBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await mediaBtn.click();
        await delay(1000);
      }

      // Set the file on the hidden file input
      const fileInput = page.locator("input[type='file'][accept*='image'], input[type='file']").first();
      await fileInput.setInputFiles(tmpFile);
      await delay(3000); // wait for upload to process
      console.log("  [linkedin] Image attached");
    }

    // Type into editor (try modal, page, inline placeholder, iframes)
    const editorContext = modal ?? page;
    const editor = editorContext
      .locator(
        "div[role='textbox'], .ql-editor, div[contenteditable='true'], div[data-test-id='composer-editor'], div[data-placeholder*='talk about'], div[data-placeholder*='Write a post'], div[aria-label*='Write a post'], div[aria-label*='What do you want']"
      )
      .first()
      .or(
        page.locator(
          "div[role='textbox'], [contenteditable='true'], .ql-editor, div[data-test-id='composer-editor'], div[data-placeholder*='talk about'], div[data-placeholder*='Write a post'], div[aria-label*='Write a post'], div[aria-label*='What do you want']"
        ).first()
      );

    let editorFound = false;
    try {
      await editor.waitFor({ timeout: 20_000, state: "visible" });
      await editor.click({ force: true });
      await delay(300);
      await page.keyboard.type(content, { delay: 30 });
      editorFound = true;
    } catch {}

    // Inline composer fallback by placeholder/text
    if (!editorFound) {
      const inline = page
        .locator(
          "div[data-placeholder*='talk about'], div[aria-label*='talk about'], div[data-placeholder*='post'], div[aria-label*='post'], div:has-text('What do you want to talk about')"
        )
        .first();
      if (await inline.isVisible({ timeout: 5000 }).catch(() => false)) {
        await inline.click({ force: true }).catch(() => {});
        await delay(300);
        await page.keyboard.insertText(content);
        editorFound = true;
      }
    }

    // Fallback: search inside iframes for a contenteditable editor
    if (!editorFound) {
      const frames: Frame[] = page.frames();
      for (const frame of frames) {
        const frameEditor = frame
          .locator(
            "div[role='textbox'], [contenteditable='true'], .ql-editor, div[data-test-id='composer-editor'], div[data-placeholder*='talk about'], div[data-placeholder*='Write a post'], div[aria-label*='Write a post'], div[aria-label*='What do you want']"
          )
          .first();
        if (await frameEditor.isVisible({ timeout: 3000 }).catch(() => false)) {
          await frameEditor.click({ force: true }).catch(() => {});
          await delay(300);
          await frame.keyboard.type(content, { delay: 30 });
          editorFound = true;
          break;
        }
      }
    }

    // Fallback: DOM search including shadow roots
    if (!editorFound) {
      const handle = await findEditableViaDOM(page);
      if (handle) {
        try {
          await handle.scrollIntoViewIfNeeded?.().catch(() => {});
          await handle.click({ force: true }).catch(() => {});
          await page.evaluate(
            (el, text) => {
              // @ts-ignore
              el.focus?.();
              // @ts-ignore
              el.innerHTML = "";
              const event = new InputEvent("input", { bubbles: true, cancelable: true });
              // @ts-ignore
              el.dispatchEvent(event);
              // @ts-ignore
              document.execCommand("insertText", false, text);
            },
            handle,
            content
          );
          editorFound = true;
        } finally {
          await handle.dispose();
        }
      }
    }

    if (!editorFound) {
      throw new Error("LinkedIn editor not found (modal/inline/iframe/dom).");
    }

    await delay(800);

    // Click Post button
    const postButton = modal.locator(
      "button.share-actions__primary-action, button[data-control-name='share.sharebox_post_button']"
    ).first();
    const fallbackPostButton = modal
      .locator("button:has-text('Post'):not(:has-text('photo')):not(:has-text('video'))")
      .last();

    const primaryVisible = await postButton.isVisible({ timeout: 5_000 }).catch(() => false);
    if (primaryVisible) {
      await postButton.click({ force: true });
    } else {
      await fallbackPostButton.waitFor({ timeout: 15_000 });
      await fallbackPostButton.click({ force: true });
    }

    await delay(5000);

    // Try to capture post URL
    let postUrl: string | undefined;
    try {
      const postLink = page.locator('a[href*="/feed/update/"]').first();
      const href = await postLink.getAttribute("href", { timeout: 5000 }).catch(() => null);
      if (href) postUrl = href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
    } catch {}

    return postUrl;
  } catch (err) {
    await capture(page, "error");
    try {
      const candidates = await page
        .locator("div[role='textbox'], [contenteditable='true'], .ql-editor, div[data-test-id='composer-editor']")
        .all();
      console.log("[linkedin] Candidate editors found:", candidates.length);
      for (let i = 0; i < Math.min(candidates.length, 3); i++) {
        const html = await candidates[i].evaluate((el: any) => el.outerHTML).catch(() => "");
        console.log(`[linkedin] editor[${i}]:`, html.slice(0, 300));
      }
    } catch {}
    throw err;
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    await context.close();
    await browser.close();
  }
}

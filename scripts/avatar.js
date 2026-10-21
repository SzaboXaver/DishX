import { supabase } from "./supabaseClient.js";

// Every user's picture lives at  avatars/<user_id>/avatar  (public bucket),
// so any page can build the URL from a user id alone - no extra database query.

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

// Placeholder shown when a user has no picture (yet)
export function fallbackUrl(username) {
  return `https://placehold.co/600x400/d8c3ad/5a4030?text=${encodeURIComponent(username || "User")}`;
}

// Public URL of a user's picture. Pass a number as `bust` to skip the browser cache.
export function avatarSrc(user_id, bust) {
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(`${user_id}/avatar`);
  return bust ? `${data.publicUrl}?v=${bust}` : data.publicUrl;
}

// Attributes for an <img> in a template string:
//   <img ${avatarAttrs(user_id, username)} alt="...">
export function avatarAttrs(user_id, username) {
  const fallback = fallbackUrl(username);
  if (!user_id) return `src="${esc(fallback)}"`;
  return `src="${esc(avatarSrc(user_id))}" data-fallback="${esc(fallback)}" data-avatar-of="${esc(user_id)}"`;
}

// Same thing for an <img> element that already exists in the HTML
export function setAvatar(img, user_id, username) {
  if (!img || !user_id) return;
  img.dataset.fallback = fallbackUrl(username);
  img.dataset.avatarOf = user_id;
  delete img.dataset.fallbackUsed;
  img.src = avatarSrc(user_id);
}

// If a picture doesn't exist (404), swap in the placeholder.
// Image errors don't bubble, so this listens in the capture phase.
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.dataset.fallback) return;
    if (img.dataset.fallbackUsed) return; // don't loop if the placeholder fails too
    img.dataset.fallbackUsed = "1";
    img.src = img.dataset.fallback;
  },
  true,
);

// Uploads (or replaces) the signed-in user's picture
export async function uploadAvatar(file) {
  if (!file || !file.type.startsWith("image/")) {
    return { success: false, error: new Error("Please choose an image file.") };
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: new Error("The image is too big (max 2 MB).") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: new Error("Not signed in") };
  }

  const { error } = await supabase.storage
    .from("avatars")
    .upload(`${user.id}/avatar`, file, {
      upsert: true, // replace the old picture
      contentType: file.type,
      cacheControl: "60",
    });
  if (error) {
    console.error("Avatar upload error:", error);
    return { success: false, error };
  }

  return { success: true, user_id: user.id };
}

// After an upload: reload every picture of that user on the current page
export function refreshAvatars(user_id) {
  const v = Date.now();
  document.querySelectorAll("img[data-avatar-of]").forEach((img) => {
    if (img.dataset.avatarOf !== user_id) return;
    delete img.dataset.fallbackUsed;
    img.src = avatarSrc(user_id, v);
  });
}
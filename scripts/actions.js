import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; //Supabase import
const supabase = createClient(
  "https://zlncrzsnizkozucrkvyn.supabase.co", //Project URL
  "sb_publishable_RJZkVfaz6GD0OF1jTFLTGQ_T9ESEubR", //Publishable key
);

export async function upload({
  thoughts, recipeTitle, prepTime, difficulty, servings,
  ingredients, cookingSteps, url, imageFileInput,
  visibility, hashtags, likescount, dateofpub,
}) {
  // 1. Check auth first
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("Error getting user:", userError.message);
    return { success: false, error: userError };
  }
  if (!user) {
    return { success: false, error: new Error("Not signed in") };
  }

  // 2. Upload image
  const { error: storageError } = await supabase.storage
    .from("recipeImages")
    .upload(url, imageFileInput);
  if (storageError) {
    console.error("Upload error:", storageError);
    return { success: false, error: storageError };
  }

  // 3. Insert recipe into the right table
  const isPublic = visibility === "public";
  const table = isPublic ? "public_recipes" : "private_recipes";

  const row = {
    nameid: user.id,
    dateofpub,
    thoughts,
    recipetitle: recipeTitle,
    preptime: prepTime,
    difficulty,
    servings,
    ingredients,
    cookingsteps: cookingSteps,
    imageSrc: url,
    hashtags,
    ...(isPublic && { likescount }),
  };

  const { error: insertError } = await supabase.from(table).insert(row);
  if (insertError) {
    console.error("Insert error:", insertError);
    // roll back the image
    await supabase.storage.from("recipeImages").remove([url]);
    return { success: false, error: insertError };
  }

  return { success: true };
}

export async function fetchRecipes() {
  const empty = { recipes: [], usernames: new Map(), user_id: undefined };

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error(sessionError);
    return empty;
  }
  const user_id = sessionData.session?.user?.id;

  const { data: recipes, error: recipesError } = await supabase
    .from("public_recipes")
    .select();
  if (recipesError) {
    console.error("Error fetching recipes:", recipesError);
    return empty;
  }

  const nameIds = [...new Set(recipes.map((r) => r.nameid))];
  const { data: users, error: usersError } = await supabase
    .from("recipes_with_users")
    .select("nameid, username")
    .in("nameid", nameIds);
  if (usersError) console.error("Error fetching users:", usersError);

  const usernames = new Map((users ?? []).map((u) => [u.nameid, u.username]));

  return { recipes, usernames, user_id };
}
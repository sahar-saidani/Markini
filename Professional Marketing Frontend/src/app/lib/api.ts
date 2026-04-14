export type ProfilePayload = {
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  description: string;
  company: string;
  sector: string;
  company_description: string;
  product_name: string;
  product_description: string;
  product_benefits: string;
  product_price: string;
  target_title: string;
  target_sector: string;
  target_company_size: string;
  target_country: string;
  tone: string;
  objective: string;
  linkedin_email: string;
  linkedin_password?: string;
  qwen_api_key?: string;
  qwen_api_base?: string;
  qwen_model?: string;
  auto_publish?: boolean;
  auto_connect?: boolean;
  auto_follow_up?: boolean;
};

export type ProfileResponse = ProfilePayload & {
  user_id: number;
  linkedin_password_configured: boolean;
  qwen_api_key_configured: boolean;
  last_synced_at: string | null;
  openoutreach_campaign_id: number | null;
};

export type AuthSession = {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
};

export type PostResponse = {
  id: number;
  subject: string;
  source_content: string;
  topic: string;
  body: string;
  hashtags: string[];
  selected_hashtags: string[];
  status: string;
  readability_score: number;
  word_count: number;
  char_count: number;
  linkedin_post_id: string;
  published_at: string | null;
};

type FetchOptions = RequestInit & {
  bodyJson?: unknown;
};

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const match = cookies.find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const csrfToken = method === "GET" || method === "HEAD" ? "" : getCookie("csrftoken");
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      ...(options.headers ?? {}),
    },
    body: options.bodyJson === undefined ? options.body : JSON.stringify(options.bodyJson),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data?.detail ?? "Request failed.");
  }
  return data as T;
}

async function fetchJsonAllow401<T>(url: string, options: FetchOptions = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const method = (options.method ?? "GET").toUpperCase();
  const csrfToken = method === "GET" || method === "HEAD" ? "" : getCookie("csrftoken");
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      ...(options.headers ?? {}),
    },
    body: options.bodyJson === undefined ? options.body : JSON.stringify(options.bodyJson),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok && response.status !== 401) {
    throw new Error((data as { detail?: string })?.detail ?? "Request failed.");
  }
  return { ok: response.ok, status: response.status, data: data as T };
}

export async function fetchSession() {
  const response = await fetchJsonAllow401<AuthSession>("/api/app/auth/session/");
  return response.data;
}

export async function loginUser(payload: { username: string; password: string }) {
  return fetchJson<AuthSession>("/api/app/auth/login/", {
    method: "POST",
    bodyJson: payload,
  });
}

export async function signupUser(payload: {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}) {
  return fetchJson<AuthSession>("/api/app/auth/signup/", {
    method: "POST",
    bodyJson: payload,
  });
}

export async function logoutUser() {
  return fetchJson<{ authenticated: false }>("/api/app/auth/logout/", {
    method: "POST",
  });
}

export async function fetchProfile() {
  return fetchJson<{ profile: ProfileResponse }>("/api/app/profile/");
}

export async function saveProfile(profile: Partial<ProfilePayload>) {
  return fetchJson<{ profile: ProfileResponse }>("/api/app/profile/", {
    method: "POST",
    bodyJson: profile,
  });
}

export async function syncOpenOutreach() {
  return fetchJson<{
    sync: {
      campaign_id: number;
      campaign_name: string;
      restarted: boolean;
      campaign_objective_path: string;
      product_docs_path: string;
      account_secrets_path: string;
    };
    profile: ProfileResponse;
  }>("/api/app/profile/sync-openoutreach/", {
    method: "POST",
  });
}

export async function generatePost(payload: {
  product_name?: string;
  target_audience?: string;
  brief_description?: string;
  source_url?: string;
  subject?: string;
  source_content?: string;
  tone_override?: string;
}) {
  return fetchJson<{ job: { id: number; status: string } }>("/api/app/posts/generate/", {
    method: "POST",
    bodyJson: payload,
  });
}

export async function fetchGenerationJob(jobId: number) {
  return fetchJson<{
    job: {
      id: number;
      status: string;
      error_message: string;
      post?: PostResponse;
    };
  }>(`/api/app/posts/jobs/${jobId}/`);
}

export async function publishPost(
  postId: number,
  payload: {
    body: string;
    selected_hashtags: string[];
    image_url?: string;
    image_data_url?: string;
    platform?: "linkedin" | "facebook";
  },
) {
  return fetchJson<{ post: PostResponse }>(`/api/app/posts/${postId}/publish/`, {
    method: "POST",
    bodyJson: payload,
  });
}

export async function fetchDashboard() {
  return fetchJson<{
    stats: { title: string; value: number }[];
    recent_leads: { name: string; title: string; status: string }[];
    weekly: { day: string; leads: number; engagement: number }[];
  }>("/api/app/dashboard/");
}

export async function fetchPipeline() {
  return fetchJson<{
    stages: { stage: string; count: number }[];
    conversion_rates: { pending_to_connected: number; connected_to_completed: number };
    leads: {
      name: string;
      title: string;
      status: string;
      source: string;
      comment_text: string;
      last_activity: string;
    }[];
    messages: {
      content: string;
      created_at: string;
      is_outgoing: boolean;
    }[];
  }>("/api/app/pipeline/");
}

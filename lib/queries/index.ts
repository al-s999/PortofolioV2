import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  collectTranslatables,
  mergeTranslations,
  translateViaEdge,
} from '@/lib/i18n/autoTranslate';
import type { TranslatableTable } from '@/lib/i18n/autoTranslate';
import type { AboutMe, Project, Contact, Skill } from '@/types';

const QUERY_KEYS = {
  aboutMe: ['aboutMe'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  featuredProjects: ['projects', 'featured'] as const,
  contacts: ['contacts'] as const,
  adminStats: ['adminStats'] as const,
};

// Request yang nyangkut di jaringan flaky tidak boleh loading selamanya:
// abort paksa setelah timeout agar masuk cabang error + tombol retry.
const QUERY_TIMEOUT_MS = 30_000;

function queryTimeout() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

export function useAboutMe() {
  return useQuery({
    queryKey: QUERY_KEYS.aboutMe,
    queryFn: async (): Promise<AboutMe | null> => {
      const { signal, done } = queryTimeout();
      try {
        const { data, error } = await supabase
          .from('about_me')
          .select('*')
          .abortSignal(signal)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return data;
      } finally {
        done();
      }
    },
  });
}

export function useProjects(featuredOnly = false) {
  return useQuery({
    queryKey: featuredOnly ? QUERY_KEYS.featuredProjects : QUERY_KEYS.projects,
    queryFn: async (): Promise<Project[]> => {
      const { signal, done } = queryTimeout();
      try {
        let query = supabase
          .from('projects')
          .select('*')
          .abortSignal(signal)
          .order('order_index', { ascending: true });

        if (featuredOnly) {
          query = query.eq('featured', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
      } finally {
        done();
      }
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.project(id),
    queryFn: async (): Promise<Project | null> => {
      if (!id) return null;
      const { signal, done } = queryTimeout();
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .abortSignal(signal)
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } finally {
        done();
      }
    },
    enabled: !!id,
  });
}

export function useContacts(includeInactive = false) {
  const { loading, isAdmin } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEYS.contacts, { includeInactive }],
    enabled: includeInactive ? !loading && isAdmin : true,
    queryFn: async (): Promise<Contact[]> => {
      const { signal, done } = queryTimeout();
      try {
        let query = supabase.from('contacts').select('*').abortSignal(signal);

        if (!includeInactive) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query
          .order('order_index', { ascending: true });

        if (error) throw error;
        return data ?? [];
      } finally {
        done();
      }
    },
  });
}

export function useAdminStats() {
  const { loading, isAdmin } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.adminStats,
    enabled: !loading && isAdmin,
    queryFn: async () => {
      const [projects, contacts, featured] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('featured', true),
      ]);
      
      const { data: aboutMe } = await supabase
        .from('about_me')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return {
        totalProjects: projects.count ?? 0,
        totalContacts: contacts.count ?? 0,
        featuredProjects: featured.count ?? 0,
        lastUpdated: aboutMe?.updated_at ?? null,
      };
    },
  });
}

export function useUpdateAboutMe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<AboutMe> & { skills?: Skill[] }) => {
      const { data, error } = await supabase
        .from('about_me')
        .upsert({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.aboutMe });
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.featuredProjects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.featuredProjects });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.featuredProjects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projects: Pick<Project, 'id' | 'order_index'>[]) => {
      const updates = projects.map((p, index) => 
        supabase.from('projects').update({ order_index: index }).eq('id', p.id)
      );
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error).map(r => r.error);
      if (errors.length > 0) throw errors[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.featuredProjects });
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contact: Omit<Contact, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File | Blob; path: string }) => {
      const { data, error } = await supabase.storage
        .from('portfolio-images')
        .upload(path, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(data.path);
      
      return publicUrl;
    },
  });
}

// --- i18n: localized reads (Task 9) ------------------------------------------
// `select('*')` above already returns the `i18n` JSONB mirror column, so these
// selectors stay in sync with every existing hook without touching them.

/** Read a (possibly nested, dot-path) value from an object/array tree. */
function getPathValue(obj: unknown, path: string): unknown {
  if (obj == null || typeof obj !== 'object') return undefined;
  const segments = path.split('.');
  let cur: any = obj;
  for (const seg of segments) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[/^\d+$/.test(seg) ? Number(seg) : seg];
  }
  return cur;
}

/**
 * Localized field read with EN/source fallback (never blank/throw).
 * Reads `row.i18n[lang][field]` (nested dot paths supported, e.g.
 * `education.0.degree`, `content_blocks.1.caption`), then the source
 * `row[field]`, then `fallback`.
 */
export function localized<T = string>(
  row: any,
  lang: 'en' | 'id',
  field: string,
  fallback?: T,
): T {
  const hit = getPathValue(row?.i18n?.[lang], field);
  if (typeof hit === 'string') {
    if (hit.length > 0) return hit as T;
  } else if (hit !== undefined && hit !== null) {
    return hit as T;
  }
  const base = getPathValue(row, field);
  if (base !== undefined && base !== null) return base as T;
  return fallback as T;
}

/** Pick several fields through {@link localized} in one call. */
export function pickLang(
  row: any,
  lang: 'en' | 'id',
  fields: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    out[field] = localized(row, lang, field, getPathValue(row, field));
  }
  return out;
}

// --- i18n: admin save helper (Task 9) ----------------------------------------

/**
 * Fill both `i18n.id` and `i18n.en` mirrors for an admin save payload.
 *
 * The free-text source language is unknown (auto-detect), so both directions
 * are translated in parallel and merged; whatever succeeds is kept and any
 * pre-existing `row.i18n` mirrors are preserved by `mergeTranslations`.
 *
 * NEVER throws for translation failures (edge function down, quota out,
 * secret unset): the source payload is still returned with `pending: true`
 * so the caller can commit it and show a pending badge instead.
 * Skips the network entirely when there is nothing translatable.
 */
export async function withAutoTranslations(
  table: TranslatableTable,
  data: any,
): Promise<{ payload: any; pending: boolean }> {
  const items = collectTranslatables(table, data);
  if (items.length === 0) return { payload: data, pending: false };

  const texts = items.map((item) => item.text);
  const [idRes, enRes] = await Promise.allSettled([
    translateViaEdge(texts, 'ID'),
    translateViaEdge(texts, 'EN'),
  ]);

  let payload = data;
  let pending = false;
  if (idRes.status === 'fulfilled') {
    payload = mergeTranslations(payload, items, idRes.value, 'id');
  } else {
    pending = true;
  }
  if (enRes.status === 'fulfilled') {
    payload = mergeTranslations(payload, items, enRes.value, 'en');
  } else {
    pending = true;
  }
  return { payload, pending };
}
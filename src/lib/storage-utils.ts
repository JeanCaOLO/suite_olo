/**
 * Utilidades para manejo seguro de Supabase Storage
 */

/**
 * Normaliza un path de Storage para evitar errores "requested path is invalid"
 * 
 * @param bucketName - Nombre del bucket (ej: 'avatars', 'app-logos')
 * @param input - Path o URL completa del archivo
 * @returns Path normalizado relativo al bucket, o null si es inválido
 * 
 * @example
 * // Convierte URL completa a path relativo
 * normalizeStoragePath('avatars', 'https://xxx.supabase.co/storage/v1/object/public/avatars/user/photo.jpg')
 * // => 'user/photo.jpg'
 * 
 * // Limpia path con barras iniciales
 * normalizeStoragePath('avatars', '/folder/file.png')
 * // => 'folder/file.png'
 * 
 * // Retorna null para valores vacíos
 * normalizeStoragePath('avatars', '')
 * // => null
 */
export function normalizeStoragePath(bucketName: string, input: string | null | undefined): string | null {
  // Validar entrada
  if (!input || typeof input !== 'string') {
    console.log('🔍 STORAGE_PATH_VALIDATION: Input vacío o inválido', { input });
    return null;
  }

  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    console.log('🔍 STORAGE_PATH_VALIDATION: Input vacío después de trim');
    return null;
  }

  console.log('🔍 STORAGE_PATH_RAW:', { bucketName, input: trimmedInput });

  let normalizedPath = trimmedInput;

  // Si es una URL completa de Supabase Storage, extraer solo el path relativo
  if (trimmedInput.includes('supabase.co/storage/v1/object/')) {
    try {
      const url = new URL(trimmedInput);
      const pathParts = url.pathname.split('/');
      
      // Formato típico: /storage/v1/object/public/{bucket}/{path}
      const bucketIndex = pathParts.indexOf(bucketName);
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Tomar todo después del nombre del bucket
        normalizedPath = pathParts.slice(bucketIndex + 1).join('/');
        console.log('🔍 STORAGE_PATH_EXTRACTED_FROM_URL:', normalizedPath);
      } else {
        console.warn('⚠️ STORAGE_PATH_WARNING: No se pudo extraer path del bucket de la URL', {
          url: trimmedInput,
          bucketName,
          pathParts
        });
        return null;
      }
    } catch (error) {
      console.error('❌ STORAGE_PATH_ERROR: Error al parsear URL', { input: trimmedInput, error });
      return null;
    }
  }

  // Remover barras iniciales
  normalizedPath = normalizedPath.replace(/^\/+/, '');

  // Validar que el path no esté vacío después de normalizar
  if (!normalizedPath) {
    console.log('🔍 STORAGE_PATH_EMPTY_AFTER_NORMALIZATION');
    return null;
  }

  console.log('✅ STORAGE_PATH_NORMALIZED:', normalizedPath);
  return normalizedPath;
}

/**
 * Obtiene la URL pública de un archivo en Storage de forma segura
 * 
 * @param supabase - Cliente de Supabase
 * @param bucketName - Nombre del bucket
 * @param path - Path del archivo (será normalizado automáticamente)
 * @returns URL pública o null si el path es inválido
 */
export async function getStoragePublicUrl(
  supabase: any,
  bucketName: string,
  path: string | null | undefined
): Promise<string | null> {
  const normalizedPath = normalizeStoragePath(bucketName, path);

  if (!normalizedPath) {
    console.log('🚫 STORAGE_FETCH_SKIPPED_EMPTY_PATH:', { bucketName, originalPath: path });
    return null;
  }

  try {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(normalizedPath);

    console.log('✅ STORAGE_FETCH_RESULT:', { ok: true, url: data.publicUrl });
    return data.publicUrl;
  } catch (error) {
    console.error('❌ STORAGE_FETCH_RESULT:', { ok: false, error, bucketName, path: normalizedPath });
    return null;
  }
}

/**
 * Descarga un archivo de Storage de forma segura
 * 
 * @param supabase - Cliente de Supabase
 * @param bucketName - Nombre del bucket
 * @param path - Path del archivo (será normalizado automáticamente)
 * @returns Blob del archivo o null si hay error
 */
export async function downloadStorageFile(
  supabase: any,
  bucketName: string,
  path: string | null | undefined
): Promise<Blob | null> {
  const normalizedPath = normalizeStoragePath(bucketName, path);

  if (!normalizedPath) {
    console.log('🚫 STORAGE_FETCH_SKIPPED_EMPTY_PATH:', { bucketName, originalPath: path });
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(normalizedPath);

    if (error) {
      console.error('❌ STORAGE_FETCH_RESULT:', { ok: false, error, bucketName, path: normalizedPath });
      return null;
    }

    console.log('✅ STORAGE_FETCH_RESULT:', { ok: true, size: data?.size });
    return data;
  } catch (error) {
    console.error('❌ STORAGE_FETCH_RESULT:', { ok: false, error, bucketName, path: normalizedPath });
    return null;
  }
}

/**
 * Elimina un archivo de Storage de forma segura
 * 
 * @param supabase - Cliente de Supabase
 * @param bucketName - Nombre del bucket
 * @param path - Path del archivo (será normalizado automáticamente)
 * @returns true si se eliminó correctamente, false si hubo error
 */
export async function removeStorageFile(
  supabase: any,
  bucketName: string,
  path: string | null | undefined
): Promise<boolean> {
  const normalizedPath = normalizeStoragePath(bucketName, path);

  if (!normalizedPath) {
    console.log('🚫 STORAGE_DELETE_SKIPPED_EMPTY_PATH:', { bucketName, originalPath: path });
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([normalizedPath]);

    if (error) {
      console.error('❌ STORAGE_DELETE_RESULT:', { ok: false, error, bucketName, path: normalizedPath });
      return false;
    }

    console.log('✅ STORAGE_DELETE_RESULT:', { ok: true, bucketName, path: normalizedPath });
    return true;
  } catch (error) {
    console.error('❌ STORAGE_DELETE_RESULT:', { ok: false, error, bucketName, path: normalizedPath });
    return false;
  }
}

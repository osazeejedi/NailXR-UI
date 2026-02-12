import { supabase } from './supabase-client'

/**
 * Uploads an AR captured image to Supabase Storage
 * @param file The image blob to upload
 * @param userId The user's ID
 * @returns The result containing the path and public URL of the uploaded image
 */
export async function uploadARImage(file: Blob, userId: string, designId?: string) {
  const timestamp = Date.now()
  const id = designId || crypto.randomUUID()
  const path = `${userId}/${id}/${timestamp}.png`

  const { data, error } = await supabase.storage
    .from('nail-designs')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/png'
    })

  if (error) {
    console.error('Error uploading AR image:', error)
    throw new Error(error.message)
  }

  const { data: publicUrlData } = supabase.storage
    .from('nail-designs')
    .getPublicUrl(path)

  return {
    path: data.path,
    publicUrl: publicUrlData.publicUrl
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param path The path of the file to delete
 */
export async function deleteARImage(path: string) {
  const { error } = await supabase.storage
    .from('nail-designs')
    .remove([path])

  if (error) {
    console.error('Error deleting AR image:', error)
    throw new Error(error.message)
  }
}

import { supabase } from './supabase-client'
import { uploadARImage, deleteARImage } from './storage'
import type { SavedLooksTable } from './supabase-client'

export type SavedLook = SavedLooksTable['Row']
export type NewSavedLook = SavedLooksTable['Insert']
export type UpdateSavedLook = SavedLooksTable['Update']

/**
 * Saves a new look with an AR captured image
 * @param lookData The data for the new look
 * @param imageBlob The optional image blob to upload
 * @returns The saved look record
 */
export async function saveARLook(
  lookData: Omit<NewSavedLook, 'preview_image_url' | 'id' | 'created_at' | 'updated_at'>,
  imageBlob?: Blob
) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be logged in to save a look')
    }

    let preview_image_url = null

    // Upload image if provided
    if (imageBlob) {
      const uploadResult = await uploadARImage(imageBlob, user.id)
      preview_image_url = uploadResult.publicUrl
    }

    // Validate required fields
    if (!lookData.name || !lookData.color_hex) {
      throw new Error('Name and color are required')
    }

    // Insert record
    const { data, error } = await supabase
      .from('saved_looks')
      .insert({
        ...lookData,
        user_id: user.id,
        preview_image_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // If DB insert fails but image was uploaded, cleanup the image
      if (preview_image_url) {
        // Extract path from URL? Or just ignore for now as it's public bucket
        // For now we'll just log the error
        console.error('Failed to cleanup image after DB error')
      }
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error('Error saving look:', error)
    throw error
  }
}

/**
 * Fetches all saved looks for the current user
 * @returns List of saved looks
 */
export async function getUserLooks() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Return empty array if not logged in, or could throw error
    return []
  }

  const { data, error } = await supabase
    .from('saved_looks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching looks:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Deletes a saved look and its associated image
 * @param id The ID of the look to delete
 */
export async function deleteLook(id: string) {
  // First get the look to check for image URL
  const { data: look, error: fetchError } = await supabase
    .from('saved_looks')
    .select('preview_image_url')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  // Delete from DB
  const { error: deleteError } = await supabase
    .from('saved_looks')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  // Delete image from storage if exists
  if (look?.preview_image_url) {
    try {
      // Extract path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/nail-designs/[path]
      // We need just the [path] part
      const url = new URL(look.preview_image_url)
      const pathParts = url.pathname.split('/nail-designs/')
      
      if (pathParts.length > 1) {
        const path = pathParts[1]
        await deleteARImage(path)
      }
    } catch (e) {
      console.error('Error deleting image file:', e)
      // Don't fail the whole operation if image delete fails
    }
  }
}

/**
 * Updates a saved look
 * @param id The ID of the look to update
 * @param updates The fields to update
 */
export async function updateLook(id: string, updates: UpdateSavedLook) {
  const { data, error } = await supabase
    .from('saved_looks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

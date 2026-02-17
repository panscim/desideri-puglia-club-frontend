import { supabase } from './supabase'

export const uploadAvatar = async (userId, file) => {
  try {
    // Valida il file
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Il file deve essere un\'immagine')
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Il file deve essere inferiore a 2MB')
    }

    // Genera nome file univoco
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`

    // Carica il file
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Sovrascrive se esiste già
      })

    if (error) throw error

    // Ottieni URL pubblico
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Aggiorna il profilo utente
    const { error: updateError } = await supabase
      .from('utenti')
      .update({ foto_profilo: fileName })
      .eq('id', userId)

    if (updateError) throw updateError

    return { url: publicUrl, path: fileName }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw error
  }
}

export const deleteAvatar = async (userId, filePath) => {
  try {
    // Elimina il file dallo storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (error) throw error

    // Aggiorna il profilo utente
    const { error: updateError } = await supabase
      .from('utenti')
      .update({ foto_profilo: null })
      .eq('id', userId)

    if (updateError) throw updateError

    return true
  } catch (error) {
    console.error('Error deleting avatar:', error)
    throw error
  }
}

export const getAvatarUrl = (filePath) => {
  if (!filePath) return null
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return publicUrl
}

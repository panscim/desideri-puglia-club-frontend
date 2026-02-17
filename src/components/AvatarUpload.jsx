import { useState, useRef } from 'react'
import { Upload, X, Camera } from 'lucide-react'
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '../services/avatar'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const AvatarUpload = ({ currentAvatar, onUploadComplete }) => {
  const { profile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentAvatar ? getAvatarUrl(currentAvatar) : null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview locale
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const { url } = await uploadAvatar(profile.id, file)
      toast.success('Foto profilo aggiornata!')
      if (onUploadComplete) onUploadComplete(url)
    } catch (error) {
      toast.error(error.message || 'Errore nel caricamento')
      setPreview(currentAvatar ? getAvatarUrl(currentAvatar) : null)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentAvatar) return
    if (!confirm('Eliminare la foto profilo?')) return

    setUploading(true)
    try {
      await deleteAvatar(profile.id, currentAvatar)
      setPreview(null)
      toast.success('Foto profilo eliminata')
      if (onUploadComplete) onUploadComplete(null)
    } catch (error) {
      toast.error('Errore nell\'eliminazione')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Avatar Preview */}
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-sand"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-olive-light bg-opacity-20 flex items-center justify-center text-3xl border-4 border-sand">
            {profile?.nome?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-olive-dark text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-50"
          title="Cambia foto"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-sm flex items-center space-x-2 mb-2 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Caricamento...' : 'Carica Foto'}</span>
        </button>

        {preview && !uploading && (
          <button
            onClick={handleDelete}
            className="text-sm text-coral hover:text-red-600 flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>Rimuovi</span>
          </button>
        )}

        <p className="text-xs text-olive-light mt-2">
          JPG, PNG o GIF. Max 2MB.
        </p>
      </div>
    </div>
  )
}

export default AvatarUpload

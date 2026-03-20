import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, useRef } from 'react'
import { useDataStore } from '@/stores'

const municipioSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    uf: z.string().min(2, 'Selecione o estado'),
    slug: z.string().optional(),
})

type MunicipioFormData = z.infer<typeof municipioSchema>

const estados = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
]

export function MunicipioFormPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = !!id
    const [isLoading, setIsLoading] = useState(false)

    const { municipios, addMunicipio, updateMunicipio, uploadImageMunicipio, uploadImageEducacao, deleteImageMunicipio, deleteImageEducacao } = useDataStore()
    const municipio = municipios.find((m) => m.id === Number(id))
    const [uploadingImage, setUploadingImage] = useState<'municipio' | 'educacao' | null>(null)
    const [imageError, setImageError] = useState<string | null>(null)
    const fileMunicipioRef = useRef<HTMLInputElement>(null)
    const fileEducacaoRef = useRef<HTMLInputElement>(null)

    // For creation mode: store selected files locally until submit
    const [pendingImageMunicipio, setPendingImageMunicipio] = useState<File | null>(null)
    const [pendingImageEducacao, setPendingImageEducacao] = useState<File | null>(null)
    const [previewMunicipio, setPreviewMunicipio] = useState<string | null>(null)
    const [previewEducacao, setPreviewEducacao] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<MunicipioFormData>({
        resolver: zodResolver(municipioSchema),
    })

    useEffect(() => {
        if (municipio) {
            reset({
                nome: municipio.nome,
                uf: municipio.uf,
                slug: municipio.slug || '',
            })
        }
    }, [municipio, reset])

    const MAX_FILE_SIZE = 5 * 1024 * 1024
    const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

    const validateFile = (file: File): boolean => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setImageError('Formato inválido. Use PNG, JPEG ou WebP.')
            return false
        }
        if (file.size > MAX_FILE_SIZE) {
            setImageError('Arquivo muito grande. Máximo 5MB.')
            return false
        }
        setImageError(null)
        return true
    }

    const handlePendingFile = (file: File, type: 'municipio' | 'educacao') => {
        if (!validateFile(file)) return
        const url = URL.createObjectURL(file)
        if (type === 'municipio') {
            if (previewMunicipio) URL.revokeObjectURL(previewMunicipio)
            setPendingImageMunicipio(file)
            setPreviewMunicipio(url)
        } else {
            if (previewEducacao) URL.revokeObjectURL(previewEducacao)
            setPendingImageEducacao(file)
            setPreviewEducacao(url)
        }
    }

    const removePendingFile = (type: 'municipio' | 'educacao') => {
        if (type === 'municipio') {
            if (previewMunicipio) URL.revokeObjectURL(previewMunicipio)
            setPendingImageMunicipio(null)
            setPreviewMunicipio(null)
        } else {
            if (previewEducacao) URL.revokeObjectURL(previewEducacao)
            setPendingImageEducacao(null)
            setPreviewEducacao(null)
        }
    }

    const handleImageUpload = async (file: File, type: 'municipio' | 'educacao') => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setImageError('Formato inválido. Use PNG, JPEG ou WebP.')
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            setImageError('Arquivo muito grande. Máximo 5MB.')
            return
        }
        setImageError(null)
        setUploadingImage(type)
        try {
            if (type === 'municipio') {
                await uploadImageMunicipio(Number(id), file)
            } else {
                await uploadImageEducacao(Number(id), file)
            }
        } catch (error) {
            setImageError((error as Error).message || 'Erro ao enviar imagem.')
        } finally {
            setUploadingImage(null)
        }
    }

    const handleImageDelete = async (type: 'municipio' | 'educacao') => {
        setImageError(null)
        setUploadingImage(type)
        try {
            if (type === 'municipio') {
                await deleteImageMunicipio(Number(id))
            } else {
                await deleteImageEducacao(Number(id))
            }
        } catch (error) {
            setImageError((error as Error).message || 'Erro ao remover imagem.')
        } finally {
            setUploadingImage(null)
        }
    }

    const onSubmit = async (data: MunicipioFormData) => {
        setIsLoading(true)

        try {
            if (isEditing && id) {
                await updateMunicipio(Number(id), data)
            } else {
                const created = await addMunicipio(data)
                // Upload pending images after creation
                if (pendingImageMunicipio) {
                    await uploadImageMunicipio(created.id, pendingImageMunicipio)
                }
                if (pendingImageEducacao) {
                    await uploadImageEducacao(created.id, pendingImageEducacao)
                }
            }
            navigate('/admin/municipios')
        } catch (error) {
            console.error('Erro ao salvar:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-8 col-xl-6">
                    {/* Back button */}
                    <button
                        className="btn btn-outline-secondary mb-4"
                        onClick={() => navigate('/admin/municipios')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Voltar
                    </button>

                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom py-3">
                            <h4 className="card-title mb-0 fw-bold">
                                <i className="bi bi-building me-2 text-primary"></i>
                                {isEditing ? 'Editar Município' : 'Novo Município'}
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                {/* Nome do Município */}
                                <div className="mb-4">
                                    <label htmlFor="nome" className="form-label fw-medium">
                                        Nome do Município <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="nome"
                                        className={`form-control form-control-lg ${errors.nome ? 'is-invalid' : ''}`}
                                        placeholder="Ex: São Paulo"
                                        {...register('nome')}
                                    />
                                    {errors.nome && (
                                        <div className="invalid-feedback">{errors.nome.message}</div>
                                    )}
                                </div>

                                {/* Estado (UF) */}
                                <div className="mb-4">
                                    <label htmlFor="uf" className="form-label fw-medium">
                                        Estado <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        id="uf"
                                        className={`form-select form-select-lg ${errors.uf ? 'is-invalid' : ''}`}
                                        {...register('uf')}
                                    >
                                        <option value="">Selecione o estado</option>
                                        {estados.map((estado) => (
                                            <option key={estado.value} value={estado.value}>
                                                {estado.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.uf && (
                                        <div className="invalid-feedback">{errors.uf.message}</div>
                                    )}
                                </div>

                                {/* Slug */}
                                <div className="mb-4">
                                    <label htmlFor="slug" className="form-label fw-medium">
                                        Slug
                                    </label>
                                    <input
                                        type="text"
                                        id="slug"
                                        className="form-control form-control-lg"
                                        placeholder="Ex: sao-paulo"
                                        {...register('slug')}
                                    />
                                    <div className="form-text">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Opcional - Identificador único para URL
                                    </div>
                                </div>

                                {/* Imagens */}
                                <div className="mb-4">
                                    <label className="form-label fw-medium">
                                        <i className="bi bi-image me-1"></i>
                                        Imagens
                                    </label>
                                    {!isEditing && (
                                        <div className="alert alert-info py-2 mb-3">
                                            <small><i className="bi bi-info-circle me-1"></i>As imagens serão enviadas ao cadastrar o município.</small>
                                        </div>
                                    )}
                                    {imageError && (
                                        <div className="alert alert-danger alert-dismissible fade show py-2" role="alert">
                                            <small><i className="bi bi-exclamation-triangle me-1"></i>{imageError}</small>
                                            <button type="button" className="btn-close btn-close-sm" style={{ padding: '0.5rem' }} onClick={() => setImageError(null)}></button>
                                        </div>
                                    )}
                                    <div className="row g-3">
                                        {/* Imagem do Município */}
                                        <div className="col-12 col-md-6">
                                            <small className="text-muted d-block mb-1">Imagem do Município</small>
                                            <input
                                                ref={fileMunicipioRef}
                                                type="file"
                                                className="d-none"
                                                accept=".png,.jpg,.jpeg,.webp"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        if (isEditing) handleImageUpload(file, 'municipio')
                                                        else handlePendingFile(file, 'municipio')
                                                    }
                                                    e.target.value = ''
                                                }}
                                            />
                                            {(isEditing ? municipio?.imageMunicipioUrl : previewMunicipio) ? (
                                                <div className="border rounded-3 p-2 text-center">
                                                    <img
                                                        src={(isEditing ? municipio?.imageMunicipioUrl : previewMunicipio)!}
                                                        alt="Imagem do Município"
                                                        className="img-fluid rounded mb-2"
                                                        style={{ maxHeight: 150, objectFit: 'cover' }}
                                                    />
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            disabled={uploadingImage === 'municipio'}
                                                            onClick={() => fileMunicipioRef.current?.click()}
                                                        >
                                                            {uploadingImage === 'municipio' ? (
                                                                <span className="spinner-border spinner-border-sm"></span>
                                                            ) : (
                                                                <><i className="bi bi-arrow-repeat me-1"></i>Trocar</>
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            disabled={uploadingImage === 'municipio'}
                                                            onClick={() => isEditing ? handleImageDelete('municipio') : removePendingFile('municipio')}
                                                        >
                                                            <i className="bi bi-trash me-1"></i>Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="border rounded-3 p-3 text-center text-muted"
                                                    style={{ cursor: uploadingImage === 'municipio' ? 'wait' : 'pointer', borderStyle: 'dashed' }}
                                                    onClick={() => !uploadingImage && fileMunicipioRef.current?.click()}
                                                >
                                                    {uploadingImage === 'municipio' ? (
                                                        <span className="spinner-border spinner-border-sm"></span>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-cloud-arrow-up d-block mb-1" style={{ fontSize: 28 }}></i>
                                                            <small>Clique para enviar</small>
                                                            <br />
                                                            <small className="text-muted">PNG, JPEG ou WebP (max 5MB)</small>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Imagem da Educação */}
                                        <div className="col-12 col-md-6">
                                            <small className="text-muted d-block mb-1">Imagem da Educação</small>
                                            <input
                                                ref={fileEducacaoRef}
                                                type="file"
                                                className="d-none"
                                                accept=".png,.jpg,.jpeg,.webp"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        if (isEditing) handleImageUpload(file, 'educacao')
                                                        else handlePendingFile(file, 'educacao')
                                                    }
                                                    e.target.value = ''
                                                }}
                                            />
                                            {(isEditing ? municipio?.imageEducacaoUrl : previewEducacao) ? (
                                                <div className="border rounded-3 p-2 text-center">
                                                    <img
                                                        src={(isEditing ? municipio?.imageEducacaoUrl : previewEducacao)!}
                                                        alt="Imagem da Educação"
                                                        className="img-fluid rounded mb-2"
                                                        style={{ maxHeight: 150, objectFit: 'cover' }}
                                                    />
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            disabled={uploadingImage === 'educacao'}
                                                            onClick={() => fileEducacaoRef.current?.click()}
                                                        >
                                                            {uploadingImage === 'educacao' ? (
                                                                <span className="spinner-border spinner-border-sm"></span>
                                                            ) : (
                                                                <><i className="bi bi-arrow-repeat me-1"></i>Trocar</>
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            disabled={uploadingImage === 'educacao'}
                                                            onClick={() => isEditing ? handleImageDelete('educacao') : removePendingFile('educacao')}
                                                        >
                                                            <i className="bi bi-trash me-1"></i>Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="border rounded-3 p-3 text-center text-muted"
                                                    style={{ cursor: uploadingImage === 'educacao' ? 'wait' : 'pointer', borderStyle: 'dashed' }}
                                                    onClick={() => !uploadingImage && fileEducacaoRef.current?.click()}
                                                >
                                                    {uploadingImage === 'educacao' ? (
                                                        <span className="spinner-border spinner-border-sm"></span>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-cloud-arrow-up d-block mb-1" style={{ fontSize: 28 }}></i>
                                                            <small>Clique para enviar</small>
                                                            <br />
                                                            <small className="text-muted">PNG, JPEG ou WebP (max 5MB)</small>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="d-flex gap-3 pt-3 border-top">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-lg flex-fill"
                                        onClick={() => navigate('/admin/municipios')}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg flex-fill"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2"></i>
                                                {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

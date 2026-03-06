import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
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

    const { municipios, addMunicipio, updateMunicipio } = useDataStore()
    const municipio = municipios.find((m) => m.id === Number(id))

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

    const onSubmit = async (data: MunicipioFormData) => {
        setIsLoading(true)

        try {
            if (isEditing && id) {
                await updateMunicipio(Number(id), data)
            } else {
                await addMunicipio(data)
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

                    {/* Form Card */}
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

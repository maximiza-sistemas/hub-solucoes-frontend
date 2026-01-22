import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { useDataStore } from '@/stores'
import { generateId } from '@/lib/utils'

const solucaoSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    categoria: z.enum(['educacao', 'saude', 'financeiro', 'administrativo', 'social', 'outros']),
    url: z.string().url('URL inválida').optional().or(z.literal('')),
    status: z.enum(['ativo', 'inativo']),
})

type SolucaoFormData = z.infer<typeof solucaoSchema>

const categorias = [
    { value: 'educacao', label: 'Educação' },
    { value: 'saude', label: 'Saúde' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'social', label: 'Social' },
    { value: 'outros', label: 'Outros' },
]

export function SolucaoFormPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = !!id
    const [isLoading, setIsLoading] = useState(false)

    const { solucoes, addSolucao, updateSolucao } = useDataStore()
    const solucao = solucoes.find((s) => s.id === id)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<SolucaoFormData>({
        resolver: zodResolver(solucaoSchema),
        defaultValues: {
            status: 'ativo',
        },
    })

    useEffect(() => {
        if (solucao) {
            reset({
                nome: solucao.nome,
                descricao: solucao.descricao,
                categoria: solucao.categoria,
                url: solucao.url || '',
                status: solucao.status,
            })
        }
    }, [solucao, reset])

    const onSubmit = async (data: SolucaoFormData) => {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 500))

        const solucaoData = {
            ...data,
            url: data.url || undefined,
        }

        if (isEditing && id) {
            updateSolucao(id, solucaoData)
        } else {
            addSolucao({
                id: generateId(),
                ...solucaoData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
        }

        setIsLoading(false)
        navigate('/admin/solucoes')
    }

    return (
        <div className="max-w-2xl mx-auto animate-[fade-in_0.3s_ease-out]">
            <Button
                variant="ghost"
                onClick={() => navigate('/admin/solucoes')}
                className="mb-4"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {isEditing ? 'Editar Solução' : 'Nova Solução'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Nome da Solução"
                            placeholder="Ex: Portal Educacional"
                            error={errors.nome?.message}
                            {...register('nome')}
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Descrição
                            </label>
                            <textarea
                                className="flex min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-slate-400"
                                placeholder="Descreva a solução..."
                                {...register('descricao')}
                            />
                            {errors.descricao && (
                                <p className="mt-1 text-sm text-error-500">{errors.descricao.message}</p>
                            )}
                        </div>

                        <Select
                            label="Categoria"
                            options={categorias}
                            placeholder="Selecione a categoria"
                            error={errors.categoria?.message}
                            {...register('categoria')}
                        />

                        <Input
                            label="URL de Acesso"
                            placeholder="https://exemplo.gov.br"
                            helperText="Opcional - Link para acessar a solução"
                            error={errors.url?.message}
                            {...register('url')}
                        />

                        <Select
                            label="Status"
                            options={[
                                { value: 'ativo', label: 'Ativo' },
                                { value: 'inativo', label: 'Inativo' },
                            ]}
                            error={errors.status?.message}
                            {...register('status')}
                        />

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/admin/solucoes')}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

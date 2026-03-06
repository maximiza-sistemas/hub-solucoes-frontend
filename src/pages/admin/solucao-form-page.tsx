import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui'
import { useDataStore } from '@/stores'

const solucaoSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    link: z.string().url('URL inválida').optional().or(z.literal('')),
    municipioId: z.number({ message: 'Selecione um município' }).min(1, 'Selecione um município'),
})

type SolucaoFormData = z.infer<typeof solucaoSchema>

export function SolucaoFormPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = !!id
    const [isLoading, setIsLoading] = useState(false)

    const { solucoes, addSolucao, updateSolucao, municipios, fetchMunicipios } = useDataStore()
    const solucao = solucoes.find((s) => s.id === Number(id))

    useEffect(() => {
        if (municipios.length === 0) {
            fetchMunicipios()
        }
    }, [municipios.length, fetchMunicipios])

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<SolucaoFormData>({
        resolver: zodResolver(solucaoSchema),
    })

    useEffect(() => {
        if (solucao) {
            reset({
                nome: solucao.nome,
                descricao: solucao.descricao,
                link: solucao.link || '',
                municipioId: solucao.municipioId,
            })
        }
    }, [solucao, reset])

    const onSubmit = async (data: SolucaoFormData) => {
        setIsLoading(true)

        const solucaoData = {
            ...data,
            link: data.link || undefined,
        }

        try {
            if (isEditing && id) {
                await updateSolucao(Number(id), solucaoData)
            } else {
                await addSolucao(solucaoData)
            }
            navigate('/admin/solucoes')
        } catch (error) {
            console.error('Erro ao salvar:', error)
        } finally {
            setIsLoading(false)
        }
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

                        <Select
                            label="Município"
                            placeholder="Selecione um município"
                            options={municipios.map((m) => ({
                                value: String(m.id),
                                label: m.nome,
                            }))}
                            error={errors.municipioId?.message}
                            disabled={isLoading}
                            {...register('municipioId', { valueAsNumber: true })}
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

                        <Input
                            label="URL de Acesso"
                            placeholder="https://exemplo.gov.br"
                            helperText="Opcional - Link para acessar a solução"
                            error={errors.link?.message}
                            {...register('link')}
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

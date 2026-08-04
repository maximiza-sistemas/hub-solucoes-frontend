/**
 * Erros da API tipados.
 *
 * O backend responde em dois formatos e o código antigo só entendia um deles:
 *
 *   { timestamp, status, error, message }                    -> erro simples
 *   { timestamp, status, error, messages: { campo: msg } }   -> erro de validação
 *
 * A chave de validação é `messages` no PLURAL, então `error.message` vinha undefined
 * e a mensagem degradava para o genérico "Erro de validação", jogando fora todo o
 * detalhe por campo. Aqui os dois formatos são tratados, e o status HTTP — que também
 * se perdia ao lançar um Error nu — fica acessível.
 */

export interface ApiErrorBody {
    timestamp?: string
    status?: number
    error?: string
    message?: string
    /** Erros de validação por campo (MethodArgumentNotValidException). */
    messages?: Record<string, string>
}

export class ApiError extends Error {
    readonly status: number
    readonly body: ApiErrorBody
    readonly fieldErrors: Record<string, string>

    constructor(status: number, body: ApiErrorBody) {
        super(
            body.message
            || (body.messages ? Object.values(body.messages).join(' · ') : undefined)
            || body.error
            || 'Erro na requisição'
        )
        this.name = 'ApiError'
        this.status = status
        this.body = body
        this.fieldErrors = body.messages ?? {}
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
}

/** Mensagem exibível para o usuário, com fallback para quando o erro não é da API. */
export function getErrorMessage(error: unknown, fallback = 'Erro na requisição'): string {
    if (error instanceof Error && error.message) return error.message
    return fallback
}

/** Erros por campo, para casar com o estado `formErrors` dos formulários. */
export function getFieldErrors(error: unknown): Record<string, string> {
    return isApiError(error) ? error.fieldErrors : {}
}

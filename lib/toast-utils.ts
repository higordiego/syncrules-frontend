import type { ApiResponse } from './api'

export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive'

/**
 * Determina a variante do toast baseada na resposta da API
 * - Verde (success): quando a operação foi bem-sucedida (create/update)
 * - Amarelo (warning): quando há erro de validação/preenchimento do usuário
 * - Vermelho (destructive): quando há erro 500 do servidor ou outros erros internos
 */
export function getToastVariant(response?: ApiResponse<unknown> | { success: boolean; error?: { code?: string } }): ToastVariant {
  if (!response) {
    return 'default'
  }

  // Sucesso: verde
  if (response.success) {
    return 'success'
  }

  // Erro de validação: amarelo
  const errorCode = response.error?.code
  if (errorCode === 'VALIDATION_ERROR' || 
      errorCode === 'AUTH_REQUIRED' ||
      errorCode === 'AUTH_INVALID' ||
      errorCode === 'AUTH_EXPIRED' ||
      errorCode === 'FORBIDDEN' ||
      errorCode === 'NOT_FOUND' ||
      errorCode === 'CONFLICT' ||
      errorCode === 'LIMIT_EXCEEDED' ||
      errorCode === 'FILE_TOO_LARGE' ||
      errorCode === 'INVALID_FILE_TYPE' ||
      errorCode === 'INVALID_OPERATION' ||
      errorCode === 'INVALID_KEY_FORMAT') {
    return 'warning'
  }

  // Erro interno do servidor: vermelho
  if (errorCode === 'INTERNAL_ERROR' || 
      errorCode === 'NETWORK_ERROR' ||
      errorCode === 'CORS_ERROR' ||
      errorCode === 'HTTP_ERROR' ||
      errorCode === 'INVALID_RESPONSE' ||
      errorCode === 'SYNC_FAILED') {
    return 'destructive'
  }

  // Padrão: vermelho para outros erros
  return 'destructive'
}

/**
 * Helper para criar um toast com variante automática baseada na resposta da API
 */
export function createToastFromResponse(
  response: ApiResponse<unknown>,
  successTitle: string = 'Success',
  successDescription?: string,
  errorTitle: string = 'Error',
  errorDescription?: string
) {
  const variant = getToastVariant(response)
  
  if (response.success) {
    return {
      variant: 'success' as const,
      title: successTitle,
      description: successDescription || response.message || 'Operation completed successfully',
    }
  }

  return {
    variant,
    title: errorTitle,
    description: errorDescription || response.error?.message || 'An error occurred',
  }
}


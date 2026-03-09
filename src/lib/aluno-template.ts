import * as XLSX from 'xlsx'

const HEADERS = [
    'Escola',
    'Turma',
    'Série',
    'Turno',
    'Nome do Aluno',
    'CPF',
    'Matrícula',
    'Data de Nascimento',
]

const EXAMPLE_ROW = [
    'Escola Municipal Exemplo',
    'Turma A',
    '1º Ano',
    'MATUTINO',
    'João da Silva',
    '123.456.789-00',
    'MAT001',
    '15/03/2015',
]

export function downloadAlunoTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW])

    // Auto-adjust column widths
    ws['!cols'] = HEADERS.map((h, i) => ({
        wch: Math.max(h.length, EXAMPLE_ROW[i].length) + 2,
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos')
    XLSX.writeFile(wb, 'template_importacao_alunos.xlsx')
}

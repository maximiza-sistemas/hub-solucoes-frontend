import * as XLSX from 'xlsx'

const HEADERS = [
    'Escola',
    'Turma',
    'Série',
    'Turno',
    'Aluno',
    'CPF',
    'Matrícula',
    'Data de Nascimento',
]

const EXAMPLE_ROWS: (string)[][] = [
    ['Escola Municipal Exemplo', 'Turma A', '1 ANO', 'MATUTINO', 'João da Silva', '123.456.789-00', 'MAT001', '15/03/2015'],
    ['Escola Municipal Exemplo', 'Turma B', '2 ANO', 'VESPERTINO', 'Maria Oliveira', '', '', ''],
    ['Escola Municipal Exemplo', '3º C', '3 ANO MÉDIO', 'INTEGRAL', 'Ana Souza', '111.222.333-44', 'MAT003', '10/07/2008'],
]

const INSTRUCTIONS: string[][] = [
    ['Campo', 'Obrigatório', 'Formato / Valores aceitos'],
    ['Escola', 'Sim', 'Nome de uma escola já cadastrada no município (case-insensitive)'],
    ['Turma', 'Sim', 'Texto livre. Se a combinação nome+turno+série+escola não existir, a turma é criada automaticamente'],
    ['Série', 'Sim', '1 ANO, 2 ANO, 3 ANO, 4 ANO, 5 ANO, 6 ANO, 7 ANO, 8 ANO, 9 ANO, 1 ANO MÉDIO, 2 ANO MÉDIO, 3 ANO MÉDIO, TURMA DE HABILIDADES'],
    ['Turno', 'Sim', 'MATUTINO, VESPERTINO, NOTURNO, DIURNO, INTEGRAL'],
    ['Aluno', 'Sim', 'Nome completo (mínimo 3 caracteres). Único por município'],
    ['CPF', 'Não', 'CPF do aluno (opcional). Se preenchido, deve ser único por município (validado também dentro do próprio arquivo)'],
    ['Matrícula', 'Não', 'Texto livre'],
    ['Data de Nascimento', 'Não', 'Formato dd/MM/yyyy (ex.: 15/03/2015)'],
    [],
    ['Observações', '', ''],
    ['Ordem das colunas', '', 'A importação é feita pelo NOME da coluna, não pela posição. Você pode reordenar as colunas livremente'],
    ['Aliases aceitos', '', 'Aluno também aceita: Nome, Nome do Aluno, Nome Completo. Escola: Nome da Escola. Data de Nascimento: Nascimento'],
]

export function downloadAlunoTemplate() {
    const wsAlunos = XLSX.utils.aoa_to_sheet([HEADERS, ...EXAMPLE_ROWS])
    wsAlunos['!cols'] = HEADERS.map((h, i) => ({
        wch: Math.max(
            h.length,
            ...EXAMPLE_ROWS.map(r => String(r[i] ?? '').length),
        ) + 2,
    }))

    const wsInstr = XLSX.utils.aoa_to_sheet(INSTRUCTIONS)
    wsInstr['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 95 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsAlunos, 'Alunos')
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instruções')
    XLSX.writeFile(wb, 'template_importacao_alunos.xlsx')
}

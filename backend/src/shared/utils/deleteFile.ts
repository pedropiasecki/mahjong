import fs from 'fs';

// Usado ao trocar o avatar do profile: apaga o arquivo antigo do disco pra
// não acumular imagens órfãs em uploads/. Se o arquivo já não existir por
// qualquer motivo, ignora o erro (o objetivo é limpar, não é crítico).
export default async function deleteFile(filePath: string): Promise<void> {
	try {
		await fs.promises.access(filePath);
		await fs.promises.unlink(filePath);
	} catch {
		// arquivo já não existe — tudo bem, segue o jogo
	}
}
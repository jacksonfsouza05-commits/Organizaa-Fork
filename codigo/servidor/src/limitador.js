// Limitador simples em memória: deixa passar uma chave só a cada "intervaloMs".
// Serve para evitar spam de e-mails (recuperação de senha, e-mail de teste).
export function criarLimitador(intervaloMs) {
  const ultimos = new Map();

  return (chave) => {
    const agora = Date.now();
    const anterior = ultimos.get(chave);
    if (anterior && agora - anterior < intervaloMs) return false;

    ultimos.set(chave, agora);
    if (ultimos.size > 5000) {
      for (const [k, quando] of ultimos) {
        if (agora - quando > intervaloMs) ultimos.delete(k);
      }
    }
    return true;
  };
}

async function abrirFotoCompartilhada() {
    const token = location.pathname.split('/').pop();
    const aviso = document.getElementById('aviso');
    try {
        const resposta = await fetch(`/api/fotos-compartilhadas/${encodeURIComponent(token)}`, {cache: 'no-store'});
        if (!resposta.ok) throw new Error('Foto indisponível ou autorização revogada.');
        const dados = await resposta.json();
        document.getElementById('nome').textContent = dados.nome_prato;
        document.getElementById('credito').textContent = `Foto de ${dados.credito}, compartilhada com autorização.`;
        const foto = document.getElementById('foto');
        foto.alt = dados.nome_prato;
        foto.onload = () => { aviso.textContent = ''; foto.hidden = false; };
        foto.onerror = () => { aviso.textContent = 'Foto indisponível ou autorização revogada.'; };
        foto.src = `/api/fotos-compartilhadas/${encodeURIComponent(token)}/imagem`;
    } catch (error) { aviso.textContent = error.message; }
}
void abrirFotoCompartilhada();

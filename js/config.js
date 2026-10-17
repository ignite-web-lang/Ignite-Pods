async function loadConfig() {
  const res = await fetch('data/config.json');
  if (!res.ok) throw new Error('Não foi possível carregar data/config.json');
  return res.json();
}
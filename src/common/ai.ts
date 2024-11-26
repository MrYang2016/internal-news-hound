export async function embedOne(text: string) {
  const response = await fetch(`http://localhost:8000/embedding?text=${text}`, {
    method: 'GET'
  });
  return response.json() as Promise<number[]>;
}

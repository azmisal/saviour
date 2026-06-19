export async function fetchVault(type: string) {
  const res = await fetch(`/api/vault?type=${type}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch vault");
  }

  return data.items;
}
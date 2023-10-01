export default async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  console.log('fetchData, ', url, options);
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error('Error while fetching');
  }
  const json = await response.json();
  console.log('fetch, ', json);
  return json;
};

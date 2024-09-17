// i have ids like asst_13Z7dC9rrQknLuoa2XpeLApj, thread_lCjahxRqirqjLP8BSFJvx5lF... I want to write a function to encode and shorten these ids to a 6 character string. I want to use the following characters for encoding: 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_.

// The function should take an id as input and return the shortened id as output. The function should be able to decode the shortened id back to the original id.

const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
const base = characters.length;

export function encodeId(id: string): string {
  let num = 0;
  for (let i = 0; i < id.length; i++) {
    num = num * 256 + id.charCodeAt(i);
  }

  let result = "";
  while (num > 0) {
    result = characters[num % base] + result;
    num = Math.floor(num / base);
  }

  return result;
}

export function decodeId(id: string): string {
  let num = 0;
  for (let i = 0; i < id.length; i++) {
    num = num * base + characters.indexOf(id[i]);
  }

  let result = "";
  while (num > 0) {
    result = String.fromCharCode(num % 256) + result;
    num = Math.floor(num / 256);
  }

  return result;
}


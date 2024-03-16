import GPT3Tokenizer from 'gpt3-tokenizer';

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });

export function estimateTokens(str?: string): number {
  if (!str) {
    return 0;
  }
  const encoded: { bpe: number[]; text: string[] } = tokenizer.encode(str);
  return encoded.bpe.length;
}

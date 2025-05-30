declare module 'elevenlabs-node' {
  export class ElevenLabs {
    constructor(config: { apiKey: string })
    textToSpeech(params: {
      text: string
      voiceId: string
      modelId: string
    }): Promise<string>
  }
} 
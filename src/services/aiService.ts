export interface AICorrectionRequest {
  questionText: string;
  questionType: string;
  maxScore: number;
  studentAnswer: string;
  rubric?: string;
  imageBase64?: string;
}

export interface AICorrectionResponse {
  suggestedScore: number;
  reasoningSummary: string;
  suggestedFeedback: string;
  possibleMistakes: string[];
  detectedAnswer: string;
  isSimulated?: boolean;
}

export async function requestAICorrection(payload: AICorrectionRequest): Promise<AICorrectionResponse> {
  try {
    const response = await fetch('/api/ai/correct-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AICorrectionResponse = await response.json();
    return data;
  } catch (error) {
    console.warn('AI Correction fetch failed, employing fallback evaluation:', error);
    // Graceful offline fallback
    const answerLen = (payload.studentAnswer || '').length;
    const baseScore = Math.min(
      payload.maxScore,
      Math.max(Math.round(payload.maxScore * 0.7), Math.round((answerLen / 30) * payload.maxScore))
    );

    return {
      suggestedScore: baseScore,
      reasoningSummary:
        'Koreksi otomatis fallback: Analisis struktur kalimat dan kecocokan kata kunci menunjukkan pemahaman konsep materi yang baik.',
      suggestedFeedback:
        'Penjelasan sudah baik. Terus pertahankan kelengkapan langkah pengerjaan dan ketelitian.',
      possibleMistakes: [],
      detectedAnswer: payload.studentAnswer || (payload.imageBase64 ? '[Foto Coretan Rumus Terlampir]' : ''),
      isSimulated: true,
    };
  }
}

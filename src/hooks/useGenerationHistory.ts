import { useState, useEffect, useCallback } from 'react';

export interface GenerationHistoryItem {
  id: string;
  agentType: string;
  content: string;
  formData: Record<string, string>;
  timestamp: number;
}

const MAX_HISTORY_PER_AGENT = 10;
const STORAGE_KEY = 'ai_generation_history';

export function useGenerationHistory() {
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setHistory([]);
    }
  }, []);

  // Save new generation to history
  const saveGeneration = useCallback((
    agentType: string,
    content: string,
    formData: Record<string, string>
  ) => {
    const newItem: GenerationHistoryItem = {
      id: crypto.randomUUID(),
      agentType,
      content,
      formData,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // Filter existing items for this agent
      const agentHistory = prev.filter(item => item.agentType === agentType);
      const otherHistory = prev.filter(item => item.agentType !== agentType);

      // Keep only last 9 items for this agent (to make room for the new one)
      const trimmedAgentHistory = agentHistory.slice(-9);

      // Combine: other agents + trimmed agent history + new item
      const updated = [...otherHistory, ...trimmedAgentHistory, newItem];

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }

      return updated;
    });
  }, []);

  // Get history for specific agent
  const getAgentHistory = useCallback((agentType: string) => {
    return history
      .filter(item => item.agentType === agentType)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_PER_AGENT);
  }, [history]);

  // Get all history grouped by agent
  const getAllHistory = useCallback(() => {
    const grouped: Record<string, GenerationHistoryItem[]> = {};
    
    history.forEach(item => {
      if (!grouped[item.agentType]) {
        grouped[item.agentType] = [];
      }
      grouped[item.agentType].push(item);
    });

    // Sort each group by timestamp and limit to 10
    Object.keys(grouped).forEach(agentType => {
      grouped[agentType] = grouped[agentType]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_HISTORY_PER_AGENT);
    });

    return grouped;
  }, [history]);

  // Delete specific item
  const deleteItem = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao deletar item:', error);
      }
      return updated;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, []);

  // Clear history for specific agent
  const clearAgentHistory = useCallback((agentType: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.agentType !== agentType);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao limpar histórico do agente:', error);
      }
      return updated;
    });
  }, []);

  return {
    saveGeneration,
    getAgentHistory,
    getAllHistory,
    deleteItem,
    clearHistory,
    clearAgentHistory,
    totalItems: history.length,
  };
}

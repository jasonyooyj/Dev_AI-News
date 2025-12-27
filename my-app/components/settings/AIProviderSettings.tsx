'use client';

import { useAIProvider, AIProvider } from '@/hooks/useAIProvider';

const providerInfo: Record<AIProvider, { name: string; description: string; icon: string }> = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o Mini - Fast and efficient for most tasks',
    icon: '🤖',
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'DeepSeek Chat - Cost-effective alternative',
    icon: '🔮',
  },
};

export function AIProviderSettings() {
  const {
    status,
    selectedProvider,
    isLoading,
    error,
    changeProvider,
    getCurrentModel,
    getAvailableProviders,
  } = useAIProvider();

  if (isLoading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Provider</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-muted rounded-lg"></div>
          <div className="h-16 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <span className="text-lg">⚠️</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Provider</h2>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const availableProviders = getAvailableProviders();
  const currentModel = getCurrentModel();

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-lg">🤖</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Provider</h2>
          <p className="text-sm text-muted-foreground">
            Select your preferred AI provider for content generation
          </p>
        </div>
      </div>

      {availableProviders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">No AI providers configured</p>
          <p className="text-sm">
            Add your API key to <code className="bg-muted px-1.5 py-0.5 rounded">.env.local</code>
          </p>
          <div className="mt-4 text-left bg-muted p-4 rounded-lg text-sm font-mono">
            <p>OPENAI_API_KEY=sk-...</p>
            <p className="text-muted-foreground"># or</p>
            <p>DEEPSEEK_API_KEY=sk-...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(['openai', 'deepseek'] as AIProvider[]).map((provider) => {
            const info = providerInfo[provider];
            const isAvailable = status?.providers[provider];
            const isSelected = selectedProvider === provider;

            return (
              <button
                key={provider}
                onClick={() => isAvailable && changeProvider(provider)}
                disabled={!isAvailable}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : isAvailable
                    ? 'border-border hover:border-primary/50 hover:bg-accent/50'
                    : 'border-border/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{info.name}</span>
                      {isSelected && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Not configured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                  {isSelected && (
                    <div className="text-primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {currentModel && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Current model: <code className="bg-muted px-1.5 py-0.5 rounded">{currentModel}</code>
          </p>
        </div>
      )}
    </div>
  );
}

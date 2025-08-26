# Claude Code Router - Configuração para Ollama e OpenRouter

## 📦 Instalação

```bash
# Instalar Claude Code Router globalmente
npm install -g @musistudio/claude-code-router
```

## 🔧 Configuração

### 1. Configurar Ollama (Local)

Primeiro, certifique-se de que o Ollama está instalado e rodando:

```bash
# Instalar Ollama (se ainda não tiver)
curl -fsSL https://ollama.com/install.sh | sh

# Baixar modelos recomendados
ollama pull qwen2.5-coder:latest
ollama pull llama3.2:latest
ollama pull deepseek-coder-v2:latest
ollama pull mistral:latest

# Verificar se o Ollama está rodando
ollama list
```

### 2. Configurar OpenRouter

1. Crie uma conta em https://openrouter.ai
2. Obtenha sua API key em https://openrouter.ai/keys
3. Adicione créditos à sua conta

### 3. Atualizar Configuração

Edite o arquivo `ccr-config.json` e adicione sua chave API do OpenRouter:

```json
{
  "name": "openrouter",
  "api_base_url": "https://openrouter.ai/api/v1/chat/completions",
  "api_key": "sk-or-v1-YOUR_ACTUAL_KEY_HERE",  // <-- Adicione sua chave aqui
  ...
}
```

## 🚀 Uso

### Iniciar o Router

```bash
# Iniciar o servidor
ccr start

# Ou iniciar com arquivo de config específico
ccr start --config ./ccr-config.json
```

### Comandos Principais

```bash
# Executar Claude Code através do router
ccr code "Crie um componente React"

# Abrir interface web
ccr ui

# Verificar status
ccr status

# Reiniciar após mudanças na config
ccr restart
```

### Usar com Claude Code

```bash
# Configurar Claude Code para usar o router
export ANTHROPIC_API_KEY="router"
export ANTHROPIC_API_URL="http://localhost:8181/v1"

# Executar Claude Code normalmente
claude "Analise este código"
```

## 🎯 Roteamento Inteligente

O arquivo de configuração define roteamento específico por tarefa:

- **Código**: Usa Ollama local com `qwen2.5-coder`
- **Pesquisa**: Usa OpenRouter com `gemini-2.0-flash-thinking`
- **Review**: Usa OpenRouter com `deepseek-chat`
- **Documentação**: Usa OpenRouter com `claude-3.5-sonnet`

### Trocar Modelo Dinamicamente

Durante uma sessão do Claude Code, você pode trocar o modelo:

```
/model ollama,llama3.2:latest
```

## 📊 Modelos Disponíveis

### Ollama (Local - Gratuito)
- `qwen2.5-coder:latest` - Especializado em código
- `llama3.2:latest` - Modelo geral eficiente
- `deepseek-coder-v2:latest` - Forte em código
- `mistral:latest` - Rápido e eficiente

### OpenRouter (Cloud - Pago)
- `anthropic/claude-3.5-sonnet` - Melhor para tarefas complexas
- `google/gemini-2.0-flash-thinking-exp-1219` - Raciocínio avançado
- `openai/gpt-4o` - Multimodal poderoso
- `meta-llama/llama-3.3-70b-instruct` - Open source potente
- `deepseek/deepseek-chat` - Custo-benefício excelente
- `qwen/qwen-2.5-72b-instruct` - Multilíngue forte

## 💰 Otimização de Custos

### Estratégia Recomendada

1. **Tarefas simples de código**: Use Ollama local (gratuito)
2. **Análise complexa**: Use OpenRouter com modelos baratos como DeepSeek
3. **Tarefas críticas**: Use Claude 3.5 Sonnet ou GPT-4o

### Monitoramento de Uso

```bash
# Ver logs do router
tail -f ~/.ccr/logs/router.log

# Dashboard web para métricas
ccr ui
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Ollama não conecta**:
   ```bash
   # Verificar se Ollama está rodando
   curl http://localhost:11434/api/tags
   ```

2. **OpenRouter retorna erro 401**:
   - Verifique se a API key está correta
   - Confirme se tem créditos na conta

3. **Router não inicia**:
   ```bash
   # Verificar porta em uso
   lsof -i :8181
   
   # Usar porta diferente
   ccr start --port 8282
   ```

## 📚 Recursos Adicionais

- [Documentação Ollama](https://github.com/ollama/ollama)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [Claude Code Router GitHub](https://github.com/musistudio/claude-code-router)

## 🎮 Comandos Úteis

```bash
# Testar configuração
ccr test

# Ver versão
ccr -v

# Ajuda
ccr -h

# Parar servidor
ccr stop
```

## 🔐 Segurança

- **Nunca** commite o arquivo com API keys reais
- Use variáveis de ambiente para keys sensíveis:
  ```bash
  export OPENROUTER_API_KEY="sk-or-v1-xxx"
  ```
- Adicione `ccr-config.json` ao `.gitignore` se contiver keys

## 📈 Métricas e Monitoramento

O router coleta métricas sobre:
- Tempo de resposta por modelo
- Taxa de erro
- Uso de tokens
- Custo estimado (para modelos pagos)

Acesse em `http://localhost:8181/metrics` ou pela UI web.
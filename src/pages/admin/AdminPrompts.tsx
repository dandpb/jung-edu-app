import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  promptTemplateService, 
  PromptTemplate, 
  PromptCategory,
  PromptVariable 
} from '../../services/prompts/promptTemplateService';
import { promptTestService } from '../../services/prompts/promptTestService';
import { LoadingSpinner } from '../../components/common';
import AdminNavigation from '../../components/admin/AdminNavigation';

const AdminPrompts: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, any>>({});
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    template: string;
    variables: PromptVariable[];
  }>({
    name: '',
    description: '',
    template: '',
    variables: []
  });

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories
      const categoriesData = await promptTemplateService.getCategories();
      setCategories(categoriesData);

      // Load templates
      const templatesData = await promptTemplateService.getTemplates(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      setTemplates(templatesData);
    } catch (err) {
      setError('Erro ao carregar dados: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      template: template.template,
      variables: template.variables
    });
    setEditMode(false);
    setShowPreview(false);
    
    // Initialize preview variables with defaults
    const defaultVars: Record<string, any> = {};
    template.variables.forEach(v => {
      defaultVars[v.name] = v.defaultValue || '';
    });
    setPreviewVariables(defaultVars);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      setError(null);

      await promptTemplateService.updateTemplate(selectedTemplate.id, {
        name: formData.name,
        description: formData.description,
        template: formData.template,
        variables: formData.variables
      });

      setSuccessMessage('Prompt atualizado com sucesso!');
      setEditMode(false);
      loadData();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erro ao salvar: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariable = () => {
    setFormData({
      ...formData,
      variables: [
        ...formData.variables,
        {
          name: '',
          type: 'text',
          description: '',
          required: false,
          defaultValue: ''
        }
      ]
    });
  };

  const handleUpdateVariable = (index: number, field: keyof PromptVariable, value: any) => {
    const updatedVariables = [...formData.variables];
    updatedVariables[index] = {
      ...updatedVariables[index],
      [field]: value
    };
    setFormData({
      ...formData,
      variables: updatedVariables
    });
  };

  const handleRemoveVariable = (index: number) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((_, i) => i !== index)
    });
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;

    const compiled = promptTemplateService.compilePrompt(
      formData.template,
      previewVariables
    );
    
    setShowPreview(true);
    setShowTestResult(false);
    setTestResult(null);
  };

  const handleTestPrompt = async () => {
    if (!selectedTemplate) return;

    const compiledPrompt = promptTemplateService.compilePrompt(
      formData.template,
      previewVariables
    );

    setTestingPrompt(true);
    setTestResult(null);
    setShowTestResult(false);

    try {
      const result = await promptTestService.testPrompt(compiledPrompt);
      
      if (result.success) {
        setTestResult(result.response || 'Resposta vazia');
        setShowTestResult(true);
        
        // Show execution info if available
        if (result.executionTime) {
          const isUsingMock = promptTestService.isUsingMock();
          const info = `\n\n---\n⏱️ Tempo de execução: ${result.executionTime}ms${
            result.tokensUsed ? `\n📊 Tokens utilizados: ${result.tokensUsed}` : ''
          }${
            isUsingMock ? '\n⚠️ Modo de demonstração (sem API key configurada)' : '\n✅ Usando OpenAI API'
          }`;
          setTestResult((result.response || '') + info);
        }
      } else {
        setTestResult(`❌ Erro ao testar prompt: ${result.error || 'Erro desconhecido'}`);
        setShowTestResult(true);
      }
    } catch (error) {
      setTestResult(`❌ Erro ao testar prompt: ${(error as Error).message}`);
      setShowTestResult(true);
    } finally {
      setTestingPrompt(false);
    }
  };

  const getCompiledPreview = () => {
    if (!selectedTemplate) return '';
    return promptTemplateService.compilePrompt(formData.template, previewVariables);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gerenciamento de Prompts LLM
              </h1>
              <p className="mt-2 text-gray-600">
                Customize os prompts utilizados para geração de conteúdo com IA
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Voltar ao Admin
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Categorias</h2>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-purple-100 text-purple-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                📋 Todas as Categorias
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-purple-100 text-purple-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>

            {/* Templates List */}
            <div className="bg-white shadow-sm rounded-lg p-4 mt-4">
              <h2 className="text-lg font-semibold mb-4">Templates</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {template.key}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedTemplate ? (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedTemplate.name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selectedTemplate.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                      <span>Versão: {selectedTemplate.version}</span>
                      <span>Idioma: {selectedTemplate.language}</span>
                      <span>Última atualização: {new Date(selectedTemplate.updatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!editMode && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Editar
                      </button>
                    )}
                    {editMode && (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={() => {
                            setEditMode(false);
                            handleSelectTemplate(selectedTemplate);
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Template Editor */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  {editMode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome do Template
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Variables */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Variáveis</h3>
                      {editMode && (
                        <button
                          onClick={handleAddVariable}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          + Adicionar Variável
                        </button>
                      )}
                    </div>
                    
                    {formData.variables.length > 0 ? (
                      <div className="space-y-3">
                        {formData.variables.map((variable, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            {editMode ? (
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <input
                                  type="text"
                                  placeholder="Nome da variável"
                                  value={variable.name}
                                  onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <select
                                  value={variable.type}
                                  onChange={(e) => handleUpdateVariable(index, 'type', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="text">Texto</option>
                                  <option value="number">Número</option>
                                  <option value="array">Lista</option>
                                  <option value="boolean">Booleano</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Descrição"
                                  value={variable.description}
                                  onChange={(e) => handleUpdateVariable(index, 'description', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="flex items-center space-x-2">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={variable.required}
                                      onChange={(e) => handleUpdateVariable(index, 'required', e.target.checked)}
                                      className="mr-2"
                                    />
                                    Obrigatório
                                  </label>
                                  <button
                                    onClick={() => handleRemoveVariable(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                                    {`{{${variable.name}}}`}
                                  </span>
                                  <span className="ml-3 text-sm text-gray-600">
                                    {variable.description}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {variable.type}
                                  </span>
                                  {variable.required && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                      Obrigatório
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma variável definida</p>
                    )}
                  </div>

                  {/* Template Content */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Template do Prompt</h3>
                      {!editMode && (
                        <div className="flex space-x-2">
                          <button
                            onClick={handlePreview}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Visualizar Prévia
                          </button>
                        </div>
                      )}
                    </div>
                    {editMode ? (
                      <textarea
                        value={formData.template}
                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                        rows={15}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Digite o template do prompt aqui. Use {{nomeVariavel}} para inserir variáveis."
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                          {formData.template}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Preview Section */}
                  {showPreview && !editMode && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Prévia do Prompt Compilado</h3>
                      
                      {/* Variable Inputs for Preview */}
                      {formData.variables.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-3">
                            Valores das Variáveis para Prévia:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {formData.variables.map((variable) => (
                              <div key={variable.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {variable.name} {variable.required && <span className="text-red-500">*</span>}
                                </label>
                                {variable.type === 'boolean' ? (
                                  <select
                                    value={previewVariables[variable.name] || 'false'}
                                    onChange={(e) => setPreviewVariables({
                                      ...previewVariables,
                                      [variable.name]: e.target.value === 'true'
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  >
                                    <option value="false">Falso</option>
                                    <option value="true">Verdadeiro</option>
                                  </select>
                                ) : variable.type === 'number' ? (
                                  <input
                                    type="number"
                                    value={previewVariables[variable.name] || ''}
                                    onChange={(e) => setPreviewVariables({
                                      ...previewVariables,
                                      [variable.name]: parseInt(e.target.value)
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={previewVariables[variable.name] || ''}
                                    onChange={(e) => setPreviewVariables({
                                      ...previewVariables,
                                      [variable.name]: e.target.value
                                    })}
                                    placeholder={variable.description}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Compiled Preview */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-green-900">Prompt Compilado:</h4>
                          <button
                            onClick={handleTestPrompt}
                            disabled={testingPrompt}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {testingPrompt ? (
                              <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Testando...</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Testar Prompt</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-sm text-green-900">
                          {getCompiledPreview()}
                        </pre>
                      </div>

                      {/* Test Result */}
                      {showTestResult && testResult && (
                        <div className="mt-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-sm font-medium text-blue-900">Resposta da IA:</h4>
                              <button
                                onClick={() => {
                                  setShowTestResult(false);
                                  setTestResult(null);
                                }}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Fechar
                              </button>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                                {testResult}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-12 text-center">
                <div className="text-gray-400">
                  <svg className="mx-auto h-24 w-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xl font-medium">Selecione um template</p>
                  <p className="mt-2 text-gray-500">
                    Escolha um template na lista à esquerda para visualizar e editar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default AdminPrompts;
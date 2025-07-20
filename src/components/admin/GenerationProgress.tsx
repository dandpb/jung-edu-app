import React, { useEffect, useState } from 'react';
import { Brain, Check, AlertCircle, Loader2 } from 'lucide-react';

interface GenerationProgressProps {
  steps: GenerationStep[];
  currentStep: number;
  onCancel: () => void;
  estimatedTime?: number;
}

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  steps,
  currentStep,
  onCancel,
  estimatedTime = 45
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const handleCancel = () => {
    if (completedSteps > 0) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Gerando Seu Módulo
            </h2>
            <p className="text-gray-600">
              Nossa IA está criando conteúdo educacional personalizado para suas especificações
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{completedSteps} de {steps.length} etapas</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-300
                  ${step.status === 'in-progress' ? 'bg-purple-50 border border-purple-200' : ''}
                  ${step.status === 'completed' ? 'opacity-75' : ''}
                  ${step.status === 'error' ? 'bg-red-50 border border-red-200' : ''}
                `}
              >
                {getStepIcon(step.status)}
                <div className="flex-1">
                  <p className={`
                    font-medium
                    ${step.status === 'completed' ? 'text-gray-600' : 'text-gray-900'}
                    ${step.status === 'error' ? 'text-red-900' : ''}
                  `}>
                    {step.label}
                  </p>
                  {step.message && (
                    <p className="text-sm text-gray-500 mt-0.5">{step.message}</p>
                  )}
                </div>
                {step.status === 'in-progress' && index === currentStep && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Time Estimate */}
          <div className="flex justify-between items-center text-sm text-gray-600 mb-6">
            <span>Tempo decorrido: {formatTime(elapsedTime)}</span>
            <span>Tempo restante estimado: ~{formatTime(Math.max(0, estimatedTime - elapsedTime))}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancelar Geração
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Cancelar Geração do Módulo?
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar? Você perderá o progresso feito até agora.
              {completedSteps > 0 && ` (${completedSteps} etapas concluídas)`}
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Continuar Gerando
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  onCancel();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationProgress;
import { CheckCircle2, Circle, Instagram, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
}

interface PersonalizedModeStepperProps {
  currentStep: number;
  identityComplete: boolean;
  personComplete: boolean;
}

export function PersonalizedModeStepper({ 
  currentStep, 
  identityComplete, 
  personComplete 
}: PersonalizedModeStepperProps) {
  const steps: Step[] = [
    {
      id: 1,
      title: "Instagram",
      description: "Identidade visual",
      icon: <Instagram className="w-4 h-4" />,
      completed: identityComplete,
      active: currentStep === 1
    },
    {
      id: 2,
      title: "Foto",
      description: "Pessoa para o design",
      icon: <User className="w-4 h-4" />,
      completed: personComplete,
      active: currentStep === 2
    },
    {
      id: 3,
      title: "Gerar",
      description: "Arte personalizada",
      icon: <Sparkles className="w-4 h-4" />,
      completed: false,
      active: currentStep === 3
    }
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                step.completed 
                  ? "bg-green-500 text-white" 
                  : step.active 
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                    : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                step.icon
              )}
            </div>
            <div className="text-center">
              <div className={cn(
                "text-xs font-medium",
                step.active ? "text-primary" : step.completed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                {step.title}
              </div>
              <div className="text-[10px] text-muted-foreground hidden sm:block">
                {step.description}
              </div>
            </div>
          </div>

          {/* Connector */}
          {index < steps.length - 1 && (
            <div 
              className={cn(
                "w-8 sm:w-16 h-0.5 mx-2 transition-colors duration-300",
                step.completed ? "bg-green-500" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

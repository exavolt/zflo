import {
  BookOpen,
  GraduationCap,
  Users,
  Wrench,
  Settings,
  HeartPulse,
  FlaskConical,
  Brain,
} from 'lucide-react';

const useCases = [
  {
    icon: BookOpen,
    title: 'Interactive Storytelling',
    description:
      "Go beyond static text. With ZFlo, you can create immersive, branching narratives where the reader's choices matter. Build compelling branching narrative stories, interactive fiction, or dynamic story-driven games that react to user input, leading to multiple outcomes and deeper engagement.",
    research: {
      text: 'Studies show that interactive narratives significantly boost engagement and can improve learning outcomes, such as language development in children, by actively involving them in the storytelling process.',
      source: {
        name: 'NCBI',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6648006/',
      },
    },
  },
  {
    icon: GraduationCap,
    title: 'Educational Tutorials',
    description:
      "Transform learning from a passive activity into an interactive journey. ZFlo allows you to build adaptive tutorials that cater to individual learning styles. Create guided lessons that present information, ask questions, and branch to remedial or advanced topics based on the user's responses, ensuring a personalized and effective educational experience.",
    research: {
      text: 'Research consistently shows that interactive learning methods significantly improve knowledge retention compared to passive observation. Engaging learners with interactive elements and immediate feedback solidifies concepts and enhances long-term recall.',
      source: {
        name: 'ResearchGate',
        url: 'https://www.researchgate.net/publication/221098704_Impact_of_Interactive_Learning_on_Knowledge_Retention',
      },
    },
  },
  {
    icon: Users,
    title: 'Onboarding & Training',
    description:
      'Streamline employee training and user onboarding with interactive, self-paced walkthroughs. Guide new users through software features or internal processes step-by-step. Use conditional logic to verify completion of tasks and provide real-time feedback, reducing the learning curve and improving retention.',
    research: {
      text: 'Effective, structured onboarding makes employees 2.6x more likely to be satisfied with their workplace. Interactive, hands-on training is consistently shown to be more effective than passive methods for achieving competency and long-term role satisfaction.',
      source: {
        name: 'DevlinPeck',
        url: 'https://www.devlinpeck.com/content/employee-onboarding-statistics',
      },
    },
  },
  {
    icon: Wrench,
    title: 'Complex Troubleshooting',
    description:
      "Empower users and support staff with an expert system for diagnostics. Model complex troubleshooting flows that guide users through a series of questions to identify the root cause of a problem. The system can automatically and transparently suggest solutions, escalate issues, or provide repair instructions based on the user's inputs.",
    research: {
      text: 'Expert systems for troubleshooting have been shown to significantly reduce diagnostic time. For example, one study demonstrated a 20.7% reduction in queries needed to solve a problem, leading to faster, more cost-effective resolutions, especially for non-expert users.',
      source: {
        name: 'ScienceDirect',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/0957417494E0009J',
      },
    },
  },
  {
    icon: Settings,
    title: 'Product Configurators',
    description:
      'Simplify complex purchase decisions. Build interactive product configurators that guide customers through customization options. The system can manage dependencies, prevent incompatible selections, and provide a real-time summary of the final configured product and price, enhancing the user experience and boosting sales.',
    research: {
      text: 'Giving customers control over product customization with real-time visual feedback significantly boosts their confidence and satisfaction. This leads to higher conversion rates, increased sales, and a stronger connection to the brand.',
      source: {
        name: 'NVIDIA',
        url: 'https://www.nvidia.com/en-us/glossary/product-configurator/',
      },
    },
  },
  {
    icon: HeartPulse,
    title: 'Clinical Decision Support',
    description:
      'Model sophisticated diagnostic pathways and treatment protocols for healthcare professionals. ZFlo can represent complex medical guidelines in an interactive format, guiding clinicians through patient assessment based on symptoms, test results, and patient history to support evidence-based decision-making at the point of care.',
    research: {
      text: 'Systematic reviews and meta-analyses have shown that computerized clinical decision support systems lead to absolute improvements in care by improving diagnostic accuracy and increasing adherence to evidence-based medical guidelines.',
      source: {
        name: 'BMJ',
        url: 'https://www.bmj.com/content/370/bmj.m3216',
      },
    },
  },
  {
    icon: Brain,
    title: 'Predictable AI System Components',
    description:
      'While AI models provide powerful but unpredictable capabilities, ZFlo serves as the reliable, deterministic backbone of AI-powered applications. Use ZFlo to model structured decision trees, validation workflows, and business logic that AI systems can trigger or follow. This hybrid approach combines AI flexibility with guaranteed, auditable outcomes for critical processes.',
    research: {
      text: 'Research shows that hybrid AI systems combining deterministic rule-based components with machine learning models achieve better reliability and explainability. Structured workflows provide essential guardrails and predictable behavior patterns that pure AI systems cannot guarantee.',
      source: {
        name: 'Nature',
        url: 'https://www.nature.com/articles/s41598-021-84487-5',
      },
    },
  },
];

export function UseCasesPage() {
  return (
    <>
      <section className="flex flex-col items-center justify-center py-20 text-center bg-background">
        <div className="container">
          <h1 className="text-5xl font-bold tracking-tight">
            Unlock New Possibilities
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover how ZFlo transforms complex processes into intuitive,
            engaging experiences across various domains.
          </p>
        </div>
      </section>

      <div className="container flex flex-col items-center justify-center max-w-4xl mx-auto py-16 px-4">
        <div className="space-y-16">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${
                  isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className="flex-shrink-0 w-32 h-32 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <Icon className="w-16 h-16" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">{useCase.title}</h3>
                  <p className="text-lg text-muted-foreground">
                    {useCase.description}
                  </p>
                  {useCase.research && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                      <h4 className="font-semibold text-sm flex items-center">
                        <FlaskConical className="w-4 h-4 mr-2 text-purple-500" />
                        Research Insight
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {useCase.research.text}{' '}
                        <a
                          href={useCase.research.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          (Source: {useCase.research.source.name})
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

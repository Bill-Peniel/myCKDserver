import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Shield,
  Users,
  TrendingUp,
  ArrowRight,
  Stethoscope,
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "Suivi Personnalisé",
      description:
        "Surveillance continue de l'évolution de la maladie rénale chronique",
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "Prévention Active",
      description: "Détection précoce et prévention des complications",
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: "Équipe Médicale",
      description:
        "Coordination entre médecins, néphrologues et équipe soignante",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      title: "Analyses Avancées",
      description: "Suivi des paramètres biologiques et tendances d'évolution",
    },
  ];

  const stages = [
    {
      stage: "Stade 1",
      description: "DFG ≥ 90 ml/min/1.73m²",
      color: "bg-green-100 text-green-800",
    },
    {
      stage: "Stade 2",
      description: "DFG 60-89 ml/min/1.73m²",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      stage: "Stade 3A",
      description: "DFG 45-59 ml/min/1.73m²",
      color: "bg-orange-100 text-orange-800",
    },
    {
      stage: "Stade 3B",
      description: "DFG 30-44 ml/min/1.73m²",
      color: "bg-orange-100 text-orange-800",
    },
    {
      stage: "Stade 4",
      description: "DFG 15-29 ml/min/1.73m²",
      color: "bg-red-100 text-red-800",
    },
    {
      stage: "Stade 5",
      description: "DFG < 15 ml/min/1.73m²",
      color: "bg-red-100 text-red-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">CKD Care</span>
            </div>
            <Button
              onClick={() => setLocation("/login")}
              className="bg-[#005454] hover:bg-primary/90 text-primary-foreground hover:text-[#005454] border-2 border-[#005454] hover:border-[#005454]"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gestion de la
            <span className="text-blue-600"> Maladie Rénale</span> Chronique
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Une plateforme complète pour le suivi, la gestion et l'amélioration
            de la prise en charge des patients atteints de maladie rénale
            chronique (MRC).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#005454] hover:bg-primary/90 hover:text-[#005454] border-2 border-[#005454] text-primary-foreground text-lg px-8 py-3"
              onClick={() => setLocation("/login")}
            >
              Accéder à la plateforme
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* What is CKD Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Qu'est-ce que la Maladie Rénale Chronique ?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              La maladie rénale chronique (MRC) est une altération progressive
              et irréversible de la fonction rénale. Elle est définie par la
              présence de lésions rénales ou d'une diminution du débit de
              filtration glomérulaire (DFG) pendant plus de 3 mois.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Les 5 stades de la MRC
              </h3>
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Badge className={stage.color}>{stage.stage}</Badge>
                    <span className="text-gray-700">{stage.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="text-xl font-semibold text-blue-900 mb-4">
                Points clés à retenir
              </h4>
              <ul className="space-y-2 text-blue-800">
                <li>• 850 millions de personnes touchées dans le monde</li>
                <li>• 5ème cause de mortalité mondiale</li>
                <li>• Souvent asymptomatique aux premiers stades</li>
                <li>
                  • Dépistage précoce crucial pour ralentir la progression
                </li>
                <li>• Prise en charge multidisciplinaire nécessaire</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Notre Solution CKD Care
            </h2>
            <p className="text-lg text-gray-600">
              Une plateforme intégrée pour optimiser la prise en charge des
              patients MRC
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#005454] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à améliorer la prise en charge de vos patients ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Rejoignez les professionnels de santé qui utilisent déjà CKD Care
            pour optimiser le suivi et la gestion de leurs patients atteints de
            MRC.
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3 border border-white"
            onClick={() => setLocation("/login")}
          >
            Commencer maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Stethoscope className="h-6 w-6" />
              <span className="text-lg font-semibold">CKD Care</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 CKD Care. Plateforme de gestion de la maladie rénale
              chronique.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

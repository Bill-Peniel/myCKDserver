
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
  CheckCircle,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Heart className="h-8 w-8 text-red-200" />,
      title: "Suivi Personnalisé",
      description:
        "Surveillance continue de l'évolution de la maladie rénale chronique",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-200" />,
      title: "Prévention Active",
      description: "Détection précoce et prévention des complications",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Users className="h-8 w-8 text-green-200" />,
      title: "Équipe Médicale",
      description:
        "Coordination entre médecins, néphrologues et équipe soignante",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-200" />,
      title: "Analyses Avancées",
      description: "Suivi des paramètres biologiques et tendances d'évolution",
      color: "from-purple-500 to-indigo-500",
    },
  ];

  const stages = [
    {
      stage: "Stade 1",
      description: "DFG ≥ 90 ml/min/1.73m²",
      color: "bg-green-100 text-green-800",
      delay: "0ms",
    },
    {
      stage: "Stade 2",
      description: "DFG 60-89 ml/min/1.73m²",
      color: "bg-yellow-100 text-yellow-800",
      delay: "100ms",
    },
    {
      stage: "Stade 3A",
      description: "DFG 45-59 ml/min/1.73m²",
      color: "bg-orange-100 text-orange-800",
      delay: "200ms",
    },
    {
      stage: "Stade 3B",
      description: "DFG 30-44 ml/min/1.73m²",
      color: "bg-orange-100 text-orange-800",
      delay: "300ms",
    },
    {
      stage: "Stade 4",
      description: "DFG 15-29 ml/min/1.73m²",
      color: "bg-red-100 text-red-800",
      delay: "400ms",
    },
    {
      stage: "Stade 5",
      description: "DFG < 15 ml/min/1.73m²",
      color: "bg-red-100 text-red-800",
      delay: "500ms",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Marie Dubois",
      role: "Néphrologue",
      content: "CKD Care a révolutionné ma pratique quotidienne.",
      rating: 5,
    },
    {
      name: "Dr. Jean Martin",
      role: "Médecin généraliste",
      content: "Un outil indispensable pour le suivi de mes patients MRC.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-ping delay-2000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className={`flex items-center space-x-2 transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <Stethoscope className="h-8 w-8 text-[#005454] animate-pulse" />
              <span className="text-2xl font-bold bg-gradient-to-r from-[#005454] to-[#007070] bg-clip-text text-transparent">
                CKD Care
              </span>
            </div>
            <Button
              onClick={() => setLocation("/login")}
              className="bg-[#005454] hover:bg-[#007070] text-white transform hover:scale-105 transition-all duration-300 hover:shadow-lg"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Gestion de la
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005454] to-[#007070] animate-pulse">
              {" "}Maladie Rénale{" "}
            </span>
            Chronique
          </h1>
          <p className={`text-xl text-gray-600 mb-8 max-w-3xl mx-auto transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Une plateforme complète pour le suivi, la gestion et l'amélioration
            de la prise en charge des patients atteints de maladie rénale
            chronique (MRC).
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#005454] to-[#007070] hover:from-[#007070] hover:to-[#005454] text-white text-lg px-8 py-3 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
              onClick={() => setLocation("/login")}
            >
              Accéder à la plateforme
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Floating Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { number: "850M+", label: "Personnes touchées", icon: <Users className="h-6 w-6" /> },
            { number: "5ème", label: "Cause de mortalité", icon: <TrendingUp className="h-6 w-6" /> },
            { number: "100%", label: "Satisfaction médecins", icon: <Star className="h-6 w-6" /> },
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: `${800 + index * 200}ms` }}
            >
              <div className="flex justify-center mb-2 text-[#005454]">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-[#005454] mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What is CKD Section */}
      <section className="bg-white/50 backdrop-blur-sm py-16">
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
                  <div
                    key={index}
                    className={`flex items-center space-x-3 transform transition-all duration-500 hover:scale-105 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                    style={{ transitionDelay: stage.delay }}
                  >
                    <Badge className={`${stage.color} transition-all duration-300 hover:shadow-md`}>
                      {stage.stage}
                    </Badge>
                    <span className="text-gray-700">{stage.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <h4 className="text-xl font-semibold text-blue-900 mb-4">
                Points clés à retenir
              </h4>
              <ul className="space-y-2 text-blue-800">
                {[
                  "850 millions de personnes touchées dans le monde",
                  "5ème cause de mortalité mondiale",
                  "Souvent asymptomatique aux premiers stades",
                  "Dépistage précoce crucial pour ralentir la progression",
                  "Prise en charge multidisciplinaire nécessaire"
                ].map((point, index) => (
                  <li key={index} className="flex items-center space-x-2 transform transition-all duration-300 hover:translate-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50/50">
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
                className={`text-center hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                  activeFeature === index ? 'ring-2 ring-[#005454] shadow-xl scale-105' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <CardHeader>
                  <div className={`flex justify-center mb-4 p-3 rounded-full bg-gradient-to-r ${feature.color} bg-opacity-10`}>
                    {feature.icon}
                  </div>
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

      {/* Testimonials Section */}
      <section className="py-16 bg-white/50">
        {/*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ce que disent nos utilisateurs
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>*/}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#005454] to-[#007070] py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full opacity-5 animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white rounded-full opacity-5 animate-bounce"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">
            Prêt à améliorer la prise en charge de vos patients ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Rejoignez les professionnels de santé qui utilisent déjà CKD Care
            pour optimiser le suivi et la gestion de leurs patients atteints de
            MRC.
          </p>
          <Button
            size="lg"
            className="bg-white text-[#005454] hover:bg-gray-100 text-lg px-8 py-3 border border-white transform hover:scale-110 transition-all duration-300 hover:shadow-2xl"
            onClick={() => setLocation("/login")}
          >
            Commencer maintenant
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Stethoscope className="h-6 w-6 animate-pulse" />
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

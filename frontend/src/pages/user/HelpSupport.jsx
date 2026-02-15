import { useState } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp,
  Zap,
  MapPin,
  CreditCard,
  Calendar,
  Shield,
  Clock,
  ExternalLink,
  FileText,
  Headphones
} from 'lucide-react';
import { Button } from '../../components';

const HelpSupport = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      category: 'Getting Started',
      icon: Zap,
      questions: [
        {
          q: 'How do I start charging my EV?',
          a: 'To start charging: 1) Find a station using our "Find Stations" feature, 2) Navigate to the station, 3) Connect your vehicle to an available charger, 4) Tap "Start Charging" in the app, and 5) Monitor your charging session in real-time.'
        },
        {
          q: 'How do I create an account?',
          a: 'Click on "Register" from the login page. Fill in your personal details, vehicle information, and create a secure password. You\'ll receive a confirmation email to verify your account.'
        },
        {
          q: 'Is the EVPulse app free to use?',
          a: 'Yes, the EVPulse app is completely free to download and use. You only pay for the charging sessions at the applicable station rates.'
        }
      ]
    },
    {
      category: 'Finding Stations',
      icon: MapPin,
      questions: [
        {
          q: 'How do I find charging stations near me?',
          a: 'Use the "Find Stations" feature from your dashboard. The app uses your location to show nearby stations, their availability status, connector types, and real-time pricing. You can also search by address or filter by charger type.'
        },
        {
          q: 'What do the different station colors mean?',
          a: 'Green indicates available chargers, Yellow means some chargers are in use, Red indicates all chargers are occupied or the station is offline, and Gray means the station is under maintenance.'
        },
        {
          q: 'Can I filter stations by charger type?',
          a: 'Yes! You can filter stations by connector type (CCS, CHAdeMO, Type 2, Tesla), charging speed (Level 2, DC Fast), amenities (restrooms, food, WiFi), and price range.'
        }
      ]
    },
    {
      category: 'Bookings & Reservations',
      icon: Calendar,
      questions: [
        {
          q: 'How far in advance can I book a charging slot?',
          a: 'You can book charging slots up to 7 days in advance. Bookings can be made in 30-minute increments, with a minimum duration of 30 minutes and maximum of 4 hours.'
        },
        {
          q: 'What happens if I\'m late for my booking?',
          a: 'You have a 15-minute grace period after your scheduled start time. After that, your booking may be released to other users. Repeated no-shows may affect your booking privileges.'
        },
        {
          q: 'How do I cancel a booking?',
          a: 'Go to "My Bookings" in your dashboard, find the booking you want to cancel, and tap "Cancel Booking". Cancellations made more than 2 hours before the scheduled time are free. Late cancellations may incur a small fee.'
        }
      ]
    },
    {
      category: 'Payments & Billing',
      icon: CreditCard,
      questions: [
        {
          q: 'What payment methods are accepted?',
          a: 'We accept all major credit/debit cards (Visa, Mastercard, American Express), digital wallets (Apple Pay, Google Pay), and EVPulse wallet balance. You can manage your payment methods in Settings.'
        },
        {
          q: 'How is the charging cost calculated?',
          a: 'Charging costs are calculated based on energy consumed (kWh) and/or time spent at the charger. Some stations may have different rates for peak and off-peak hours. The estimated cost is shown before you start charging.'
        },
        {
          q: 'How do I get a receipt for my charging session?',
          a: 'Receipts are automatically emailed to your registered email address after each session. You can also download receipts from "Charging History" or "Payments" section in your dashboard.'
        }
      ]
    },
    {
      category: 'Safety & Security',
      icon: Shield,
      questions: [
        {
          q: 'Is my payment information secure?',
          a: 'Yes, absolutely. We use bank-level encryption (256-bit SSL) and are PCI DSS compliant. Your card details are tokenized and never stored on our servers.'
        },
        {
          q: 'What should I do if I encounter an emergency at a station?',
          a: 'In case of emergency, use the emergency stop button on the charger, call local emergency services if needed, and report the incident through our app. All our stations have 24/7 remote monitoring.'
        },
        {
          q: 'How do I report a safety concern?',
          a: 'Use the "Report Issue" button on any station page, call our 24/7 helpline, or email safety@evpulse.com. We take all safety reports seriously and investigate within 24 hours.'
        }
      ]
    }
  ];

  const contactOptions = [
    {
      icon: Headphones,
      title: '24/7 Helpline',
      description: 'Speak with our support team anytime',
      action: '+1 (800) EVP-ULSE',
      actionType: 'phone'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get a response within 24 hours',
      action: 'support@evpulse.com',
      actionType: 'email'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      action: 'Start Chat',
      actionType: 'chat'
    }
  ];

  const quickGuides = [
    {
      icon: Zap,
      title: 'First Time Charging',
      description: 'Step-by-step guide for your first charge'
    },
    {
      icon: CreditCard,
      title: 'Payment Setup',
      description: 'How to add and manage payment methods'
    },
    {
      icon: Calendar,
      title: 'Booking Guide',
      description: 'Learn how to reserve charging slots'
    },
    {
      icon: MapPin,
      title: 'Finding Stations',
      description: 'Tips for finding the best stations'
    }
  ];

  const toggleFaq = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setExpandedFaq(expandedFaq === key ? null : key);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 ml-4">Help & Support</h1>
        <p className="text-secondary-500 mt-2">Find answers to common questions or get in touch with our team</p>
      </div>

      {/* Quick Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactOptions.map((option, index) => (
          <div key={index} className="card hover:shadow-xl transition-all duration-300 group" style={{ backgroundColor: '#abf7b1' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary-500 transition-colors">
                <option.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-secondary-900">{option.title}</h3>
              <p className="text-sm text-secondary-500 mt-1">{option.description}</p>
              <p className="text-primary-600 font-medium mt-2">{option.action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Guides */}
      <div className="card">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          Quick Guides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickGuides.map((guide, index) => (
            <button
              key={index}
              className="p-4 bg-secondary-50 rounded-xl hover:bg-primary-50 transition-colors text-left group"
            >
              <guide.icon className="w-8 h-8 text-primary-500 mb-2" />
              <h4 className="font-medium text-secondary-900 group-hover:text-primary-700">{guide.title}</h4>
              <p className="text-sm text-secondary-500 mt-1">{guide.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="card">
        <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-500" />
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <category.icon className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="font-semibold text-secondary-800">{category.category}</h3>
              </div>
              
              <div className="space-y-2 ml-10">
                {category.questions.map((faq, questionIndex) => {
                  const isExpanded = expandedFaq === `${categoryIndex}-${questionIndex}`;
                  return (
                    <div 
                      key={questionIndex}
                      className="border border-secondary-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(categoryIndex, questionIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary-50 transition-colors"
                      >
                        <span className="font-medium text-secondary-900 pr-4">{faq.q}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-secondary-400 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 text-secondary-600 bg-secondary-50/50 border-t border-secondary-100">
                          <p className="pt-3">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Still Need Help */}
      <div className="card bg-gradient-to-r from-primary-500 to-green-500 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Still need help?</h3>
            <p className="text-primary-100 mt-1">Our support team is available 24/7 to assist you</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-primary-50"
              icon={Phone}
            >
              Call Us
            </Button>
            <Button 
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30 border-white/30"
              icon={MessageCircle}
            >
              Live Chat
            </Button>
          </div>
        </div>
      </div>

      {/* App Version */}
      <div className="text-center text-sm text-secondary-400">
        <p>EVPulse v2.1.0 • © 2026 EVPulse Inc.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-primary-500 transition-colors">Cookie Policy</a>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;

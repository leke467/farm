import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiMessageSquare,
  FiClock,
  FiShield,
} from "react-icons/fi";
import Navbar from "../../components/Navbar";
import apiService from "../../services/api";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const response = await apiService.submitContactMessage(formData);
      if (response && (response.success || response.id)) {
        setSubmitSuccess(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        setSubmitError(response?.detail || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setSubmitError(err.message || "An error occurred while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCards = [
    {
      icon: FiPhone,
      title: "Call & WhatsApp Support",
      info: "+234 903 245 9336",
      sub: "Mon - Sat, 8:00am - 6:00pm WAT",
      link: "tel:+2349032459336",
    },
    {
      icon: FiMail,
      title: "Email Support",
      info: "hello@apexlabs.com",
      sub: "24/7 dedicated support team",
      link: "mailto:hello@apexlabs.com",
    },
    {
      icon: FiMapPin,
      title: "ApexLabs Headquarters",
      info: "No 33 Nurrudeen Street",
      sub: "Olayemi Bus Stop, Ayobo, Lagos State",
      link: "https://apexlabs.it.com",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar dark={true} />

      {/* Hero Header */}
      <section className="relative pt-16 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <FiMessageSquare /> We're Here to Help Your Farm Succeed
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight mb-6">
          Get in Touch with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Livesteads Team</span>
        </h1>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Have questions about onboarding your farm, custom pricing for enterprise integration, or technical support? Send us a message and our agronomy & tech team will respond promptly.
        </p>
      </section>

      {/* Contact Cards */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <a
                key={idx}
                href={card.link}
                target={card.link.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 block group"
              >
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                <p className="text-emerald-400 font-medium text-sm mb-1">{card.info}</p>
                <p className="text-xs text-slate-400">{card.sub}</p>
              </a>
            );
          })}
        </div>
      </section>

      {/* Main Contact Form & FAQ */}
      <section className="px-6 max-w-7xl mx-auto pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Send Us a Direct Message</h2>
            <p className="text-sm text-slate-400 mb-6">Fill out the form below and an agribusiness manager will reach out within 2 hours.</p>

            {submitSuccess && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-3">
                <FiCheckCircle size={24} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Message Sent Successfully!</h4>
                  <p className="text-xs text-emerald-200">Thank you for reaching out. We have received your inquiry and will respond shortly.</p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-center gap-3">
                <FiAlertCircle size={24} className="text-red-400 flex-shrink-0" />
                <p className="text-xs">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Your Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Chief Adeleke"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@yourfarm.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+234..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g., Enterprise Setup & Pricing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Your Message *</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your farm setup, livestock numbers, crop acreage, or any specific questions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <span>Submit Message</span>
                    <FiSend />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Details & Company Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FiClock className="text-emerald-400" /> Operational Hours
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span>Monday - Friday</span>
                  <span className="font-semibold text-emerald-400">8:00 AM - 6:00 PM WAT</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span>Saturday</span>
                  <span className="font-semibold text-emerald-400">9:00 AM - 4:00 PM WAT</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday & Public Holidays</span>
                  <span className="text-slate-400">Emergency Support Only</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <FiShield className="text-emerald-400" /> Built & Maintained by ApexLabs
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Livesteads is designed and engineered by Apex Labs Global Resources Limited. We build high-reliability software systems for agriculture, logistics, media, and esports.
              </p>
              <a
                href="https://apexlabs.it.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                Visit ApexLabs Website →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

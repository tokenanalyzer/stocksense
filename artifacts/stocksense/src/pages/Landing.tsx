import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { CheckCircle2, BookOpen, ShieldCheck, Target, AlertTriangle, ArrowRight, UserCheck, LayoutList, Building2 } from "lucide-react";
import stockSenseLogo from "@assets/file_000000001d8871fa822307813ae000a5_1780324458986.png";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  mobile: z.string().min(10, "Valid mobile number is required."),
  city: z.string().min(2, "City is required."),
  experience: z.string().min(1, "Please select your experience level."),
  intent: z.string().min(10, "Please briefly explain what you want to understand."),
  contactTime: z.string().min(1, "Please select the best time to contact you."),
  consent: z.boolean().refine(val => val === true, "You must agree to be contacted.")
});

export default function Landing() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      mobile: "",
      city: "",
      experience: "",
      intent: "",
      contactTime: "",
      consent: false
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: replace with real form endpoint
    console.log("Form submitted:", values);
    setIsSubmitted(true);
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900 shadow-sm backdrop-blur">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <img src={stockSenseLogo} alt="StockSense" className="h-10 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button onClick={() => scrollTo('benefits')} className="hover:text-white transition-colors" data-testid="link-benefits">Benefits</button>
            <button onClick={() => scrollTo('audience')} className="hover:text-white transition-colors" data-testid="link-audience">Who We Are For</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors" data-testid="link-how-it-works">How It Works</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors" data-testid="link-faq">FAQ</button>
          </nav>
          <div className="flex items-center">
            <Button onClick={() => scrollTo('contact')} variant="default" className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-nav-book">
              Book a Session
            </Button>
            {/* Mobile menu toggle could go here if needed */}
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero Section */}
        <section id="hero" className="relative pt-24 pb-32 md:pt-36 md:pb-48 overflow-hidden bg-slate-50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-100/50 via-transparent to-transparent pointer-events-none" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            <motion.div 
              initial="hidden" animate="visible" variants={staggerContainer}
              className="max-w-3xl mx-auto flex flex-col items-center"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 mb-6">
                  <BookOpen className="mr-2 h-4 w-4" /> Clarity Before Capital
                </span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                Understand the Market <br className="hidden md:block"/> Before You Act
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
                We provide structured learning and market basics to curious beginners. Build a solid foundation of discipline and risk awareness before risking your hard-earned capital.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" onClick={() => scrollTo('contact')} className="w-full sm:w-auto h-12 px-8 text-base" data-testid="button-book-intro">
                  Book a Free Intro Session
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo('benefits')} className="w-full sm:w-auto h-12 px-8 text-base bg-white" data-testid="button-learn-more">
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 2. Benefits */}
        <section id="benefits" className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Start with Education?</motion.h2>
              <motion.p variants={fadeInUp} className="text-slate-600 text-lg">A strong foundation protects you from the noise. We focus on the principles that matter.</motion.p>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {[
                { icon: <LayoutList className="h-6 w-6 text-primary"/>, title: "Market Basics", desc: "Understand how the market actually works, away from the hype." },
                { icon: <ShieldCheck className="h-6 w-6 text-primary"/>, title: "Risk Awareness", desc: "Learn to identify and manage risk before it manages you." },
                { icon: <Target className="h-6 w-6 text-primary"/>, title: "Decision Discipline", desc: "Develop frameworks to make calm, rational decisions." },
                { icon: <AlertTriangle className="h-6 w-6 text-primary"/>, title: "Avoid Mistakes", desc: "Sidestep the costly emotional traps that catch most beginners." }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <Card className="h-full bg-slate-50/50 border-slate-100 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                        {item.icon}
                      </div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{item.desc}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 3. Who This Is For */}
        <section id="audience" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              >
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Designed for the curious, not the reckless.</motion.h2>
                <motion.p variants={fadeInUp} className="text-lg text-slate-600 mb-8">
                  We don't promise overnight wealth. We promise clarity. If you're looking for hot tips, this isn't for you. If you're looking for understanding, you're in the right place.
                </motion.p>
                <motion.ul variants={staggerContainer} className="space-y-6">
                  {[
                    { title: "Complete Beginners", desc: "Starting from zero and want a structured path." },
                    { title: "Working Professionals", desc: "Have capital but lack the time to filter market noise." },
                    { title: "Demat Account Holders", desc: "Opened an account but unsure of what to do next safely." }
                  ].map((item, i) => (
                    <motion.li key={i} variants={fadeInUp} className="flex gap-4">
                      <div className="mt-1 bg-green-100 rounded-full p-1 h-fit">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-lg">{item.title}</h4>
                        <p className="text-slate-600">{item.desc}</p>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="aspect-square md:aspect-[4/3] rounded-2xl bg-slate-900 overflow-hidden relative shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <Building2 className="h-16 w-16 text-slate-400 mb-6 opacity-50" />
                    <p className="text-2xl md:text-3xl font-serif text-slate-200 italic max-w-sm">"An investment in knowledge pays the best interest."</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. How It Works */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Your Path to Clarity</h2>
              <p className="text-slate-600 text-lg">A simple process to begin your educational journey.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-100 z-0" />
              
              {[
                { step: "01", title: "Share Your Interest", desc: "Fill out the brief form below to let us know where you currently stand." },
                { step: "02", title: "Get Contacted", desc: "We'll reach out at your preferred time to understand your specific needs." },
                { step: "03", title: "Join the Conversation", desc: "Start your structured learning sessions with our market educators." }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-full bg-white border-4 border-slate-50 shadow-sm flex items-center justify-center text-2xl font-bold text-primary mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Lead Capture Form */}
        <section id="contact" className="py-24 bg-slate-900 text-slate-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">Ready to build your foundation?</h2>
                <p className="text-lg text-slate-300 mb-8 max-w-md">
                  Take the first step towards market clarity. Book your free introductory session today.
                </p>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Personalized Approach</h4>
                      <p className="text-slate-400 text-sm">We tailor our conversation to your current knowledge level.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">No Pressure, No Sales</h4>
                      <p className="text-slate-400 text-sm">This is an educational discovery call, not a pitch for trading tools.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 md:p-10 text-slate-900 shadow-xl">
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received</h3>
                    <p className="text-slate-600 mb-8 max-w-xs">
                      Thank you for your interest. We will contact you at your preferred time.
                    </p>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)} data-testid="button-submit-another">Submit another</Button>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold mb-6">Request an Intro Session</h3>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mobile Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="+91 98765 43210" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Mumbai, Bangalore, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid md:grid-cols-2 gap-5">
                          <FormField
                            control={form.control}
                            name="experience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Experience Level</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="beginner">Complete Beginner</SelectItem>
                                    <SelectItem value="demat">Have a Demat Account</SelectItem>
                                    <SelectItem value="tried">Tried Trading</SelectItem>
                                    <SelectItem value="learning">Learning Actively</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contactTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Best Time to Contact</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="morning">Morning (10AM - 12PM)</SelectItem>
                                    <SelectItem value="afternoon">Afternoon (1PM - 4PM)</SelectItem>
                                    <SelectItem value="evening">Evening (5PM - 7PM)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="intent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What do you want to understand?</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="I want to learn about long-term investing..." 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="consent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50/50">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-slate-600">
                                  I agree to be contacted by call, SMS, or WhatsApp regarding my enquiry.
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full h-12 text-base font-semibold" data-testid="button-submit-form">
                          Request Session <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <p className="text-xs text-center text-slate-500 mt-4">
                          We value your privacy and will never share your details.
                        </p>
                      </form>
                    </Form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section id="faq" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-600 text-lg">Everything you need to know before getting started.</p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="bg-white px-6 rounded-lg border border-slate-100 shadow-sm">
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-6">Is this for beginners?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base pb-6 leading-relaxed">
                  Absolutely. StockSense is built specifically for individuals who are starting from zero. We strip away the jargon and focus on core concepts to build your confidence step-by-step.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="bg-white px-6 rounded-lg border border-slate-100 shadow-sm">
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-6">Do I need a demat account?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base pb-6 leading-relaxed">
                  No, you do not need a demat account to start learning. In fact, we recommend understanding the basics before you even open one. If you already have one, that's fine too.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="bg-white px-6 rounded-lg border border-slate-100 shadow-sm">
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-6">Is this educational or advisory?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base pb-6 leading-relaxed">
                  StockSense is strictly an educational platform. We provide market awareness and learning resources. We do not provide stock tips, investment advice, or buy/sell recommendations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white px-6 rounded-lg border border-slate-100 shadow-sm">
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-6">How will I be contacted?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base pb-6 leading-relaxed">
                  Once you submit your request, our team will reach out via a phone call or WhatsApp during your preferred time slot to discuss your learning goals.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white px-6 rounded-lg border border-slate-100 shadow-sm">
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-6">What happens after I submit?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base pb-6 leading-relaxed">
                  You'll have a brief, no-pressure discovery call with our team. We'll assess your current understanding and suggest a learning path that fits your pace and goals.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

      </main>

      {/* 8. Footer & Disclaimer */}
      <footer className="bg-slate-900 pt-16 pb-8 border-t border-slate-800 text-slate-400">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <img src={stockSenseLogo} alt="StockSense" className="h-10 w-auto mb-6" />
              <p className="max-w-xs text-slate-400 mb-6">
                Clarity Before Capital. Educational resources and structured learning for the modern, curious investor.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Navigation</h4>
              <ul className="space-y-4">
                <li><button onClick={() => scrollTo('hero')} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => scrollTo('benefits')} className="hover:text-white transition-colors">Benefits</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">Process</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Contact</h4>
              <ul className="space-y-4 text-sm">
                <li>hello@stocksense.edu</li>
                <li>+91 98765 43210</li>
                <li className="pt-2">123 Financial District,<br/>Mumbai, India 400001</li>
              </ul>
            </div>
          </div>
          
          <Separator className="bg-slate-800 mb-8" />
          
          {/* 7. Disclaimer */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8 text-xs text-slate-400 leading-relaxed border border-slate-800">
            <strong className="text-slate-300 block mb-2">Important Disclaimer</strong>
            StockSense is an educational and investor awareness platform only. We are not registered investment advisors. The information, resources, and discussions provided are for educational purposes and should not be construed as financial, investment, or trading advice. We do not provide stock recommendations, tips, or portfolio management services. All investments in the stock market are subject to market risks. Users are entirely responsible for their own financial decisions and should consult with a certified financial advisor before making any investment. Past performance is not indicative of future results.
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between text-sm">
            <p>© {new Date().getFullYear()} StockSense Education. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
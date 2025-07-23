import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            About Magnetize
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-slate-700">
          <p className="leading-relaxed">
          Over the years, we've grown products and helped businesses succeed by focusing on one simple principle: deliver real value first. Yet this strategy is often overlooked. That’s why we built Magnetize. This lead magnet idea generator shows you how to embrace value-first marketing by suggesting powerful ideas (free tools, quizzes and mini-apps) that you can build today to start attracting customers at a fraction of the cost. If you’d like support turning any of these ideas into reality, we're here to help.
          </p>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Why Lead Magnets Matter
            </h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>They solve a real problem and attract the right audience.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>They warm up your audience by giving value before you ask anything.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>They build trust faster than any cold email or ad.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Why Now Is the Moment
            </h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>AI code generation makes it unbelievably fast to go from idea to prototype.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>What once took months and big budgets now takes days or even hours.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>You can test, learn and refine before committing to a full build.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              How to Use Magnetize
            </h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Tell us about your business and target audience.</span>
              </li>
              
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Get a personalized list of lead magnet ideas (free tools, quizzes and mini-apps).</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Pick an idea and get building!</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>If you’d rather have us build it for you, click “Request Help” to get in touch</span>
              </li>
            </ul>
          </div>

          <p className="leading-relaxed font-medium">
            You'll walk away with actionable ideas plus a direct path to expert help bringing them to life. Enjoy!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, MapPin, Building2 } from "lucide-react";

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessData: {
    prodDescription: string;
    targetAudience: string;
    location: string | null;
    businessUrl?: string;
  };
}

export function BusinessProfileModal({ isOpen, onClose, businessData }: BusinessProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Business Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {businessData.businessUrl && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Website
              </h4>
              <div className="flex items-center gap-2">
                <a 
                  href={businessData.businessUrl.startsWith('http://') || businessData.businessUrl.startsWith('https://') 
                    ? businessData.businessUrl 
                    : `https://${businessData.businessUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1"
                >
                  {(() => {
                    try {
                      const urlWithProtocol = businessData.businessUrl.startsWith('http://') || businessData.businessUrl.startsWith('https://') 
                        ? businessData.businessUrl 
                        : `https://${businessData.businessUrl}`;
                      return new URL(urlWithProtocol).hostname;
                    } catch {
                      return businessData.businessUrl;
                    }
                  })()}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Product or Service Description
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {businessData.prodDescription}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Target Audience
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {businessData.targetAudience}
            </p>
          </div>
          
          {businessData.location && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Location
              </h4>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-slate-700">{businessData.location}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
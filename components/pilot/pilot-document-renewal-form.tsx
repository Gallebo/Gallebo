"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { renewPilotDocumentsAction } from "@/lib/pilot/actions";

export function PilotDocumentRenewalForm() {
  const [state, formAction] = useActionState(renewPilotDocumentsAction, {});
  const [licenseType, setLicenseType] = useState<"ppl_license" | "lapl_license">(
    "ppl_license",
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <span className="text-sm font-medium">Licence type</span>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="licenseType"
              value="ppl_license"
              checked={licenseType === "ppl_license"}
              onChange={() => setLicenseType("ppl_license")}
            />
            PPL
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="licenseType"
              value="lapl_license"
              checked={licenseType === "lapl_license"}
              onChange={() => setLicenseType("lapl_license")}
            />
            LAPL
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="licenseFile">
          Licence scan (PDF, JPEG, PNG)
        </label>
        <input
          id="licenseFile"
          name="licenseFile"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="licenseExpiresAt">
          Licence expiry
        </label>
        <Input
          id="licenseExpiresAt"
          name="licenseExpiresAt"
          type="date"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="medicalFile">
          Medical certificate (PDF, JPEG, PNG)
        </label>
        <input
          id="medicalFile"
          name="medicalFile"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="medicalExpiresAt">
          Medical expiry
        </label>
        <Input
          id="medicalExpiresAt"
          name="medicalExpiresAt"
          type="date"
          required
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}

      <SubmitButton label="Submit renewals" />
    </form>
  );
}

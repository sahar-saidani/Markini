from __future__ import annotations

from django import forms

from linkedin.conf import DEFAULT_GROQ_API_BASE, DEFAULT_GROQ_MODEL
from linkedin.models import Campaign, SiteConfig


class SiteConfigForm(forms.ModelForm):
    class Meta:
        model = SiteConfig
        fields = ["llm_api_key", "ai_model", "llm_api_base"]
        widgets = {
            "llm_api_key": forms.PasswordInput(
                attrs={"placeholder": "gsk_...", "autocomplete": "off"},
            ),
            "ai_model": forms.TextInput(attrs={"placeholder": DEFAULT_GROQ_MODEL}),
            "llm_api_base": forms.TextInput(attrs={"placeholder": DEFAULT_GROQ_API_BASE}),
        }
        help_texts = {
            "llm_api_key": "Groq API key used for scoring and message generation.",
            "ai_model": "Leave empty to use the Groq default model.",
            "llm_api_base": "Leave empty to use the Groq OpenAI-compatible endpoint.",
        }


class CampaignForm(forms.ModelForm):
    class Meta:
        model = Campaign
        fields = ["name", "product_docs", "campaign_objective", "booking_link"]
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "SaaS Expansion Q2"}),
            "product_docs": forms.Textarea(
                attrs={
                    "rows": 5,
                    "placeholder": "Describe the offer, value proposition, and pain points you solve.",
                }
            ),
            "campaign_objective": forms.Textarea(
                attrs={
                    "rows": 5,
                    "placeholder": "Define the ICP, target market, and business goal for this campaign.",
                }
            ),
            "booking_link": forms.URLInput(attrs={"placeholder": "https://calendly.com/your-team/demo"}),
        }
        help_texts = {
            "name": "Campaign name shown across the dashboard.",
            "product_docs": "This powers AI qualification and message generation.",
            "campaign_objective": "Explain who to target and what outcome you want.",
            "booking_link": "Optional meeting link inserted into outreach suggestions.",
        }

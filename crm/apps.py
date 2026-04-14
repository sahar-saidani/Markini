from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class CrmConfig(AppConfig):
    name = 'crm'
    label = 'crm'
    verbose_name = _('Prospect Pipeline')
    default_auto_field = 'django.db.models.AutoField'

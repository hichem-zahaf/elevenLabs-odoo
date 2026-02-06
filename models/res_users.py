# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    # ElevenLabs VIP Customer
    is_elevenlabs_vip = fields.Boolean(
        string='ElevenLabs VIP Customer',
        default=False,
        help='Mark this user as a VIP customer for ElevenLabs AI Assistant targeting.'
    )

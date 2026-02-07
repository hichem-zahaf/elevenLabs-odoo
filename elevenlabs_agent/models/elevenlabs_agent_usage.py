# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError
import hashlib
from datetime import datetime, timedelta


class ElevenLabsAgentUsage(models.Model):
    _name = 'elevenlabs.agent.usage'
    _description = 'ElevenLabs Agent Usage Tracking'
    _order = 'create_date desc'

    # Session identification
    session_id = fields.Char(
        string='Session ID',
        required=True,
        index=True,
        help='Conversation ID from ElevenLabs'
    )

    # User identification - either logged-in user or public user (IP-based)
    user_id = fields.Many2one(
        'res.users',
        string='User',
        index=True,
        ondelete='cascade',
        help='Logged-in user (if applicable)'
    )

    public_user_id = fields.Char(
        string='Public User ID',
        index=True,
        help='Unique ID for public users (generated from IP hash)'
    )

    ip_address = fields.Char(
        string='IP Address',
        help='IP address of the user (for public users)'
    )

    # Message tracking
    message_count = fields.Integer(
        string='Message Count',
        default=1,
        help='Number of messages in this session'
    )

    # Session metadata
    is_active = fields.Boolean(
        string='Active Session',
        default=True,
        help='Whether this session is still active'
    )

    session_start_date = fields.Datetime(
        string='Session Start',
        default=fields.Datetime.now,
        readonly=True
    )

    session_end_date = fields.Datetime(
        string='Session End',
        readonly=True
    )

    # Additional metadata
    user_agent = fields.Char(
        string='User Agent',
        help='Browser user agent string'
    )

    referrer = fields.Char(
        string='Referrer',
        help='Page referrer'
    )

    @api.constrains('user_id', 'public_user_id')
    def _check_user_identification(self):
        """Ensure either user_id or public_user_id is set, but not both"""
        for record in self:
            if not record.user_id and not record.public_user_id:
                raise ValidationError("Either User or Public User ID must be set.")
            if record.user_id and record.public_user_id:
                raise ValidationError("Cannot set both User and Public User ID.")

    @api.model
    def get_or_create_public_user_id(self, ip_address):
        """
        Generate a consistent unique ID for public users based on IP.
        Uses SHA256 hash of IP for privacy and consistency.
        """
        if not ip_address:
            ip_address = 'unknown'
        # Create a hash of the IP for consistent ID generation
        hash_object = hashlib.sha256(ip_address.encode())
        hex_dig = hash_object.hexdigest()
        # Use first 16 characters as the public user ID
        return 'public_' + hex_dig[:16]

    @api.model
    def check_daily_limit(self, user_id=None, public_user_id=None, daily_limit=0):
        """
        Check if user has exceeded their daily message limit.

        Returns: dict with {
            'allowed': bool,
            'current_count': int,
            'remaining': int,
            'limit': int
        }
        """
        if daily_limit <= 0:
            return {'allowed': True, 'current_count': 0, 'remaining': -1, 'limit': 0}

        # Get today's start
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Build domain for counting messages
        domain = [
            ('create_date', '>=', today_start),
            ('is_active', '=', True)
        ]

        if user_id:
            domain.append(('user_id', '=', user_id))
        else:
            domain.append(('public_user_id', '=', public_user_id))

        # Count total messages from all sessions today
        usage_records = self.search_read(domain, ['message_count'])
        total_messages = sum(record['message_count'] for record in usage_records)

        return {
            'allowed': total_messages < daily_limit,
            'current_count': total_messages,
            'remaining': max(0, daily_limit - total_messages),
            'limit': daily_limit
        }

    @api.model
    def check_global_limit(self, global_limit=0):
        """
        Check if total global usage has exceeded the limit.

        Returns: dict with {
            'allowed': bool,
            'current_count': int,
            'remaining': int,
            'limit': int
        }
        """
        if global_limit <= 0:
            return {'allowed': True, 'current_count': 0, 'remaining': -1, 'limit': 0}

        # Get today's start
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Count all messages globally for today
        domain = [
            ('create_date', '>=', today_start),
            ('is_active', '=', True)
        ]

        usage_records = self.search_read(domain, ['message_count'])
        total_messages = sum(record['message_count'] for record in usage_records)

        return {
            'allowed': total_messages < global_limit,
            'current_count': total_messages,
            'remaining': max(0, global_limit - total_messages),
            'limit': global_limit
        }

    @api.model
    def get_session_message_count(self, session_id):
        """
        Get the current message count for a specific session.

        Returns: int - current message count
        """
        session = self.search([('session_id', '=', session_id)], limit=1)
        if session:
            return session.message_count
        return 0

    @api.model
    def increment_session_messages(self, session_id):
        """
        Increment the message count for a session.

        Returns: int - new message count, or False if session not found
        """
        session = self.search([('session_id', '=', session_id)], limit=1)
        if session:
            session.message_count += 1
            return session.message_count
        return False

    @api.model
    def end_session(self, session_id):
        """
        Mark a session as ended.

        Returns: bool - True if successful
        """
        session = self.search([('session_id', '=', session_id)], limit=1)
        if session:
            session.write({
                'is_active': False,
                'session_end_date': fields.Datetime.now()
            })
            return True
        return False

    def name_get(self):
        """Custom display name for records"""
        result = []
        for record in self:
            if record.user_id:
                name = f"{record.user_id.name} - {record.session_id[:8]}... ({record.message_count} messages)"
            else:
                name = f"Public ({record.public_user_id[:16]}...) - {record.session_id[:8]}... ({record.message_count} messages)"
            result.append((record.id, name))
        return result

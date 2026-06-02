-- RLS performance: auth_rls_initplan (select auth.uid()) + merge duplicate permissive policies.

-- profiles
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT
  USING ((select auth.uid()) = id OR (select public.is_admin()));

-- pilot_profiles
DROP POLICY IF EXISTS pilot_profiles_select ON public.pilot_profiles;
CREATE POLICY pilot_profiles_select ON public.pilot_profiles
  FOR SELECT
  USING ((select auth.uid()) = user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS pilot_profiles_insert ON public.pilot_profiles;
CREATE POLICY pilot_profiles_insert ON public.pilot_profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS pilot_profiles_update ON public.pilot_profiles;
CREATE POLICY pilot_profiles_update ON public.pilot_profiles
  FOR UPDATE
  USING ((select auth.uid()) = user_id OR (select public.is_admin()))
  WITH CHECK ((select auth.uid()) = user_id OR (select public.is_admin()));

-- documents
DROP POLICY IF EXISTS documents_select ON public.documents;
CREATE POLICY documents_select ON public.documents
  FOR SELECT
  USING ((select auth.uid()) = user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS documents_insert ON public.documents;
CREATE POLICY documents_insert ON public.documents
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- verification_requests
DROP POLICY IF EXISTS verification_requests_select ON public.verification_requests;
CREATE POLICY verification_requests_select ON public.verification_requests
  FOR SELECT
  USING ((select auth.uid()) = user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS verification_requests_insert ON public.verification_requests;
CREATE POLICY verification_requests_insert ON public.verification_requests
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- airfield_operator_requests
DROP POLICY IF EXISTS airfield_requests_select ON public.airfield_operator_requests;
CREATE POLICY airfield_requests_select ON public.airfield_operator_requests
  FOR SELECT
  USING ((select auth.uid()) = user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS airfield_requests_insert ON public.airfield_operator_requests;
CREATE POLICY airfield_requests_insert ON public.airfield_operator_requests
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- aircraft
DROP POLICY IF EXISTS aircraft_insert_owner ON public.aircraft;
CREATE POLICY aircraft_insert_owner ON public.aircraft
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = pilot_user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = pilot_user_id
        AND p.role = 'pilot'
        AND p.status = 'verified'
    )
  );

DROP POLICY IF EXISTS aircraft_update_owner ON public.aircraft;
CREATE POLICY aircraft_update_owner ON public.aircraft
  FOR UPDATE
  USING ((select auth.uid()) = pilot_user_id)
  WITH CHECK ((select auth.uid()) = pilot_user_id);

DROP POLICY IF EXISTS aircraft_delete_owner ON public.aircraft;
CREATE POLICY aircraft_delete_owner ON public.aircraft
  FOR DELETE
  USING ((select auth.uid()) = pilot_user_id);

-- aircraft_photos
DROP POLICY IF EXISTS aircraft_photos_insert_owner ON public.aircraft_photos;
CREATE POLICY aircraft_photos_insert_owner ON public.aircraft_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS aircraft_photos_update_owner ON public.aircraft_photos;
CREATE POLICY aircraft_photos_update_owner ON public.aircraft_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS aircraft_photos_delete_owner ON public.aircraft_photos;
CREATE POLICY aircraft_photos_delete_owner ON public.aircraft_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.aircraft a
      WHERE
        a.id = aircraft_id
        AND a.pilot_user_id = (select auth.uid())
    )
  );

-- flights
DROP POLICY IF EXISTS flights_select_published ON public.flights;
CREATE POLICY flights_select_published ON public.flights
  FOR SELECT
  USING (status = 'published' OR (select auth.uid()) = pilot_user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS flights_insert_pilot ON public.flights;
CREATE POLICY flights_insert_pilot ON public.flights
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = pilot_user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = pilot_user_id
        AND p.role = 'pilot'
        AND p.status = 'verified'
    )
  );

DROP POLICY IF EXISTS flights_update_pilot ON public.flights;
CREATE POLICY flights_update_pilot ON public.flights
  FOR UPDATE
  USING ((select auth.uid()) = pilot_user_id OR (select public.is_admin()))
  WITH CHECK ((select auth.uid()) = pilot_user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS flights_delete_pilot ON public.flights;
CREATE POLICY flights_delete_pilot ON public.flights
  FOR DELETE
  USING ((select auth.uid()) = pilot_user_id OR (select public.is_admin()));

-- flight_photos
DROP POLICY IF EXISTS flight_photos_select ON public.flight_photos;
CREATE POLICY flight_photos_select ON public.flight_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND (
          f.status = 'published'
          OR f.pilot_user_id = (select auth.uid())
          OR (select public.is_admin())
        )
    )
  );

DROP POLICY IF EXISTS flight_photos_insert ON public.flight_photos;
CREATE POLICY flight_photos_insert ON public.flight_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS flight_photos_update ON public.flight_photos;
CREATE POLICY flight_photos_update ON public.flight_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS flight_photos_delete ON public.flight_photos;
CREATE POLICY flight_photos_delete ON public.flight_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = (select auth.uid())
    )
  );

-- flight_publish_drafts
DROP POLICY IF EXISTS flight_publish_drafts_select ON public.flight_publish_drafts;
CREATE POLICY flight_publish_drafts_select ON public.flight_publish_drafts
  FOR SELECT
  USING ((select auth.uid()) = pilot_user_id);

DROP POLICY IF EXISTS flight_publish_drafts_insert ON public.flight_publish_drafts;
CREATE POLICY flight_publish_drafts_insert ON public.flight_publish_drafts
  FOR INSERT
  WITH CHECK ((select auth.uid()) = pilot_user_id);

DROP POLICY IF EXISTS flight_publish_drafts_update ON public.flight_publish_drafts;
CREATE POLICY flight_publish_drafts_update ON public.flight_publish_drafts
  FOR UPDATE
  USING ((select auth.uid()) = pilot_user_id)
  WITH CHECK ((select auth.uid()) = pilot_user_id);

DROP POLICY IF EXISTS flight_publish_drafts_delete ON public.flight_publish_drafts;
CREATE POLICY flight_publish_drafts_delete ON public.flight_publish_drafts
  FOR DELETE
  USING ((select auth.uid()) = pilot_user_id);

-- flight_booking_requests (SELECT/INSERT; UPDATE merged below)
DROP POLICY IF EXISTS flight_booking_requests_select ON public.flight_booking_requests;
CREATE POLICY flight_booking_requests_select ON public.flight_booking_requests
  FOR SELECT
  USING (
    (select auth.uid()) = passenger_user_id
    OR (select public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS flight_booking_requests_insert ON public.flight_booking_requests;
CREATE POLICY flight_booking_requests_insert ON public.flight_booking_requests
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = passenger_user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = passenger_user_id
        AND p.role = 'passenger'
        AND p.status = 'verified'
    )
    AND EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.status = 'published'
        AND f.flight_date >= CURRENT_DATE
    )
  );

-- chat_messages
DROP POLICY IF EXISTS chat_messages_insert_user ON public.chat_messages;
CREATE POLICY chat_messages_insert_user ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    public.is_booking_participant(booking_id)
    AND public.booking_chat_unlocked(booking_id)
    AND is_system = false
    AND sender_user_id = (select auth.uid())
  );

-- in_app_notifications
DROP POLICY IF EXISTS in_app_notifications_select_own ON public.in_app_notifications;
CREATE POLICY in_app_notifications_select_own ON public.in_app_notifications
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS in_app_notifications_update_own ON public.in_app_notifications;
CREATE POLICY in_app_notifications_update_own ON public.in_app_notifications
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- push_subscriptions
DROP POLICY IF EXISTS push_subscriptions_select_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_select_own ON public.push_subscriptions
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS push_subscriptions_insert_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_insert_own ON public.push_subscriptions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS push_subscriptions_update_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_update_own ON public.push_subscriptions
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS push_subscriptions_delete_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_delete_own ON public.push_subscriptions
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- user_notification_settings
DROP POLICY IF EXISTS user_notification_settings_select_own ON public.user_notification_settings;
CREATE POLICY user_notification_settings_select_own ON public.user_notification_settings
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS user_notification_settings_insert_own ON public.user_notification_settings;
CREATE POLICY user_notification_settings_insert_own ON public.user_notification_settings
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS user_notification_settings_update_own ON public.user_notification_settings;
CREATE POLICY user_notification_settings_update_own ON public.user_notification_settings
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- pilot_reviews
DROP POLICY IF EXISTS pilot_reviews_insert_auth ON public.pilot_reviews;
CREATE POLICY pilot_reviews_insert_auth ON public.pilot_reviews
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = reviewer_user_id
    AND pilot_user_id <> (select auth.uid())
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.flight_booking_requests fbr
      JOIN public.flights fl ON fl.id = fbr.flight_id
      WHERE
        fbr.id = booking_id
        AND fbr.passenger_user_id = reviewer_user_id
        AND fbr.status = 'completed'
        AND fbr.review_deadline_at IS NOT NULL
        AND fbr.review_deadline_at > now()
        AND fl.pilot_user_id = pilot_user_id
        AND fl.status = 'completed'
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = pilot_user_id
        AND p.role = 'pilot'
        AND p.status = 'verified'
    )
  );

DROP POLICY IF EXISTS pilot_reviews_select_visible_to_participants ON public.pilot_reviews;
CREATE POLICY pilot_reviews_select_visible_to_participants ON public.pilot_reviews
  FOR SELECT
  USING (
    (select public.is_admin())
    OR (select auth.uid()) = reviewer_user_id
    OR (
      is_visible = true
      AND (select auth.uid()) = pilot_user_id
    )
  );

-- passenger_reviews
DROP POLICY IF EXISTS passenger_reviews_insert_auth ON public.passenger_reviews;
CREATE POLICY passenger_reviews_insert_auth ON public.passenger_reviews
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = pilot_user_id
    AND passenger_user_id <> (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.flight_booking_requests fbr
      JOIN public.flights fl ON fl.id = fbr.flight_id
      WHERE
        fbr.id = booking_id
        AND fbr.passenger_user_id = passenger_user_id
        AND fbr.status = 'completed'
        AND fbr.review_deadline_at IS NOT NULL
        AND fbr.review_deadline_at > now()
        AND fl.pilot_user_id = pilot_user_id
        AND fl.status = 'completed'
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = pilot_user_id AND p.role = 'pilot' AND p.status = 'verified'
    )
  );

DROP POLICY IF EXISTS passenger_reviews_select_visible_to_participants ON public.passenger_reviews;
CREATE POLICY passenger_reviews_select_visible_to_participants ON public.passenger_reviews
  FOR SELECT
  USING (
    (select public.is_admin())
    OR (select auth.uid()) = pilot_user_id
    OR (
      is_visible = true
      AND (select auth.uid()) = passenger_user_id
    )
  );

-- flight_alerts
DROP POLICY IF EXISTS flight_alerts_select_own ON public.flight_alerts;
CREATE POLICY flight_alerts_select_own ON public.flight_alerts
  FOR SELECT
  USING (passenger_user_id = (select auth.uid()) OR (select public.is_admin()));

DROP POLICY IF EXISTS flight_alerts_insert_passenger ON public.flight_alerts;
CREATE POLICY flight_alerts_insert_passenger ON public.flight_alerts
  FOR INSERT
  WITH CHECK (
    passenger_user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = (select auth.uid())
        AND role = 'passenger'
    )
  );

DROP POLICY IF EXISTS flight_alerts_delete_own ON public.flight_alerts;
CREATE POLICY flight_alerts_delete_own ON public.flight_alerts
  FOR DELETE
  USING (passenger_user_id = (select auth.uid()));

-- Korak 2: merge multiple permissive policies

-- flight_booking_requests UPDATE (passenger cancel + pilot accept/reject)
DROP POLICY IF EXISTS flight_booking_requests_update_own ON public.flight_booking_requests;
DROP POLICY IF EXISTS flight_booking_requests_update_pilot ON public.flight_booking_requests;
CREATE POLICY flight_booking_requests_update ON public.flight_booking_requests
  FOR UPDATE
  USING (
    (select auth.uid()) = passenger_user_id
    OR EXISTS (
      SELECT 1 FROM public.flights f
      WHERE f.id = flight_id AND f.pilot_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (
      (select auth.uid()) = passenger_user_id
      AND status = 'cancelled'
    )
    OR EXISTS (
      SELECT 1 FROM public.flights f
      WHERE f.id = flight_id AND f.pilot_user_id = (select auth.uid())
    )
  );

-- profiles UPDATE
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (
    id = (select auth.uid())
    OR (select public.is_admin())
  )
  WITH CHECK (
    id = (select auth.uid())
    OR (select public.is_admin())
  );

-- ledger SELECT
DROP POLICY IF EXISTS ledger_select_pilot ON public.ledger;
DROP POLICY IF EXISTS ledger_select_admin ON public.ledger;
CREATE POLICY ledger_select ON public.ledger
  FOR SELECT
  TO authenticated
  USING (
    (select public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.flight_booking_requests b
      INNER JOIN public.flights f ON f.id = b.flight_id
      WHERE b.id = ledger.booking_id
        AND f.pilot_user_id = (select auth.uid())
    )
    OR (metadata ->> 'pilot_user_id')::uuid = (select auth.uid())
  );

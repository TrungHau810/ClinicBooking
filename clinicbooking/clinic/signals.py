from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Appointment, Schedule


def update_schedule_sum(schedule):
    schedule.sum_booking = Appointment.objects.filter(schedule=schedule, cancel=False).count()
    schedule.active = schedule.sum_booking < schedule.capacity
    print(schedule.sum_booking, schedule.active)
    schedule.save(update_fields=['sum_booking', 'active'])


@receiver(post_save, sender=Appointment)
def on_appointment_saved(sender, instance, **kwargs):
    update_schedule_sum(instance.schedule)


@receiver(post_delete, sender=Appointment)
def on_appointment_deleted(sender, instance, **kwargs):
    update_schedule_sum(instance.schedule)

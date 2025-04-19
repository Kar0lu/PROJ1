from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ( String,
                         JSON,
                         ForeignKey,
                         DateTime )
from sqlalchemy.orm import ( DeclarativeBase,
                             Mapped,
                             mapped_column,
                             relationship )
from typing import List
from datetime import datetime

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Antenna(db.Model):
    ''' Antenna class '''
    __tablename__ = "antennas"

    antenna_id: Mapped[str] = mapped_column(String(3), primary_key=True)
    data: Mapped[List["Data"]] = relationship(back_populates="antenna", lazy="dynamic")

    
class Data(db.Model):
    ''' Antenna's data '''
    __tablename__ = "data"

    data_id: Mapped[str] = mapped_column(String(23), primary_key=True)
    data: Mapped[list] = mapped_column(JSON)
    timestamp: Mapped[datetime] = mapped_column(DateTime)
    antenna_id: Mapped[str] = mapped_column(ForeignKey("antennas.antenna_id"))
    antenna: Mapped["Antenna"] = relationship(back_populates="data")

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { SearchBarComponent } from '../search-bar/search-bar.component';

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    SearchBarComponent
  ],
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.css']
})
export class SearchDialogComponent {}
